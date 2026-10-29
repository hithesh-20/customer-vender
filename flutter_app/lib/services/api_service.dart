import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vendor_saathi/utils/constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  late final Dio _dio;
  late final SharedPreferences _prefs;
  String? _authToken;

  // Base URL - can be configured
  String get baseUrl => AppConstants.apiBaseUrl;

  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    _authToken = _prefs.getString('auth_token');
    
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          if (_authToken != null) 'Authorization': 'Bearer $_authToken',
        },
      ),
    );

    // Add interceptors
    _dio.interceptors.add(LogInterceptor(
      request: true,
      requestBody: true,
      responseBody: true,
      responseHeader: true,
      error: true,
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token if available
        final token = _prefs.getString('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        
        // Add device info
        options.headers['X-Device-Type'] = Platform.operatingSystem;
        options.headers['X-App-Version'] = AppConstants.appVersion;
        
        return handler.next(options);
      },
      onResponse: (response, handler) async {
        // Handle token refresh if needed
        if (response.headers.value('new-token') != null) {
          await _prefs.setString(
            'auth_token',
            response.headers.value('new-token')!,
          );
          _authToken = response.headers.value('new-token');
        }
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Token expired, try to refresh
          try {
            final refreshToken = _prefs.getString('refresh_token');
            if (refreshToken != null) {
              final refreshResponse = await refreshTokenApi(refreshToken);
              if (refreshResponse != null) {
                await _prefs.setString(
                  'auth_token',
                  refreshResponse['access_token'],
                );
                await _prefs.setString(
                  'refresh_token',
                  refreshResponse['refresh_token'],
                );
                _authToken = refreshResponse['access_token'];
                
                // Retry the original request
                final newOptions = error.requestOptions;
                newOptions.headers['Authorization'] = 
                    'Bearer ${refreshResponse['access_token']}';
                final retryResponse = await _dio.fetch(newOptions);
                return handler.resolve(retryResponse);
              }
            }
            // If refresh fails, clear token and redirect to login
            await _prefs.remove('auth_token');
            await _prefs.remove('refresh_token');
            _authToken = null;
          } catch (e) {
            debugPrint('Token refresh failed: $e');
          }
        }
        return handler.next(error);
      },
    ));
  }

  // Set auth token
  void setAuthToken(String token) {
    _authToken = token;
    _prefs.setString('auth_token', token);
  }

  // Clear auth token
  Future<void> clearAuthToken() async {
    _authToken = null;
    await _prefs.remove('auth_token');
    await _prefs.remove('refresh_token');
  }

  // Refresh token API
  Future<Map<String, dynamic>?> refreshTokenApi(String refreshToken) async {
    try {
      final response = await _dio.post(
        '/api/auth/refresh',
        data: {'refresh_token': refreshToken},
        options: Options(headers: {'Authorization': 'Bearer $refreshToken'}),
      );
      return response.data as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('Refresh token error: $e');
      return null;
    }
  }

  // GET request
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      
      final data = response.data;
      final result = fromJson != null ? fromJson(data) : data as T;
      
      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'An unexpected error occurred',
      );
    }
  }

  // POST request
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic data,
    Options? options,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        options: options,
      );
      
      final result = fromJson != null ? fromJson(response.data) : response.data as T;
      
      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'An unexpected error occurred',
      );
    }
  }

  // PUT request
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic data,
    Options? options,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        options: options,
      );
      
      final result = fromJson != null ? fromJson(response.data) : response.data as T;
      
      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'An unexpected error occurred',
      );
    }
  }

  // PATCH request
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic data,
    Options? options,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        options: options,
      );
      
      final result = fromJson != null ? fromJson(response.data) : response.data as T;
      
      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'An unexpected error occurred',
      );
    }
  }

  // DELETE request
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic data,
    Options? options,
    T Function(dynamic)? fromJson,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        options: options,
      );
      
      final result = fromJson != null ? fromJson(response.data) : response.data as T;
      
      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'An unexpected error occurred',
      );
    }
  }

  // Upload file
  Future<ApiResponse<T>> uploadFile<T>(
    String path,
    File file, {
    String? fieldName,
    Map<String, dynamic>? additionalData,
    T Function(dynamic)? fromJson,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        if (fieldName != null) fieldName: await MultipartFile.fromFile(file.path),
        if (additionalData != null) ...additionalData,
      });

      final response = await _dio.post(
        path,
        data: formData,
        onSendProgress: onSendProgress,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );

      final result = fromJson != null ? fromJson(response.data) : response.data as T;

      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'File upload failed',
      );
    }
  }

  // Download file
  Future<ApiResponse<Uint8List>> downloadFile(
    String path, {
    Map<String, dynamic>? queryParameters,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
        options: Options(
          responseType: ResponseType.bytes,
        ),
      );

      return ApiResponse<Uint8List>(
        success: true,
        data: response.data as Uint8List,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<Uint8List>(e);
    } catch (e) {
      return ApiResponse<Uint8List>(
        success: false,
        error: e.toString(),
        message: 'File download failed',
      );
    }
  }

  // Handle errors
  ApiResponse<T> _handleError<T>(DioException error) {
    String message = 'An error occurred';
    String? errorDetails;
    int? statusCode = error.response?.statusCode;

    if (error.response != null) {
      final data = error.response!.data;
      if (data is Map<String, dynamic>) {
        message = data['message'] as String? ?? message;
        errorDetails = data['error'] as String?;
      } else if (data is String) {
        message = data;
      }
    } else if (error.type == DioExceptionType.connectionTimeout ||
               error.type == DioExceptionType.receiveTimeout ||
               error.type == DioExceptionType.sendTimeout) {
      message = 'Connection timeout. Please check your internet connection.';
    } else if (error.type == DioExceptionType.connectionError) {
      message = 'No internet connection. Please check your network.';
    } else if (error.type == DioExceptionType.badResponse) {
      message = 'Server error. Please try again later.';
    }

    return ApiResponse<T>(
      success: false,
      error: errorDetails ?? error.toString(),
      message: message,
      statusCode: statusCode,
    );
  }

  // Upload multiple files
  Future<ApiResponse<T>> uploadMultipleFiles<T>(
    String path,
    List<File> files, {
    String? fieldName,
    Map<String, dynamic>? additionalData,
    T Function(dynamic)? fromJson,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        if (fieldName != null)
          fieldName: files
              .map((file) => MultipartFile.fromFileSync(file.path))
              .toList(),
        if (additionalData != null) ...additionalData,
      });

      final response = await _dio.post(
        path,
        data: formData,
        onSendProgress: onSendProgress,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
        ),
      );

      final result = fromJson != null ? fromJson(response.data) : response.data as T;

      return ApiResponse<T>(
        success: true,
        data: result,
        message: response.data['message'] as String?,
        statusCode: response.statusCode,
      );
    } on DioException catch (e) {
      return _handleError<T>(e);
    } catch (e) {
      return ApiResponse<T>(
        success: false,
        error: e.toString(),
        message: 'File upload failed',
      );
    }
  }
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final String? error;
  final int? statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
    this.statusCode,
  });

  // Helper methods
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isValidationError => statusCode == 422;
  bool get isServerError => statusCode != null && statusCode! >= 500;
  bool get isNetworkError => error?.contains('Connection') ?? false;
}
