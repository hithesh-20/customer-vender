import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vendor_saathi/models/user_model.dart';
import 'package:vendor_saathi/services/api_service.dart';
import 'package:vendor_saathi/utils/constants.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  late SharedPreferences _prefs;

  // State
  User? _user;
  bool _isAuthenticated = false;
  bool _isOnboarded = false;
  bool _isLoading = false;
  String? _error;
  String? _token;
  String? _refreshToken;

  // Getters
  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isOnboarded => _isOnboarded;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get token => _token;
  String? get refreshToken => _refreshToken;

  // Initialize
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
    await _loadAuthState();
  }

  // Load auth state from storage
  Future<void> _loadAuthState() async {
    _token = _prefs.getString(AppConstants.kAuthToken);
    _refreshToken = _prefs.getString(AppConstants.kRefreshToken);
    _isAuthenticated = _prefs.getBool(AppConstants.kIsLoggedIn) ?? false;
    _isOnboarded = _prefs.getBool(AppConstants.kIsOnboarded) ?? false;
    
    if (_isAuthenticated && _token != null) {
      await _loadUser();
    }
    
    notifyListeners();
  }

  // Load user data
  Future<void> _loadUser() async {
    try {
      final userJson = _prefs.getString(AppConstants.kUserData);
      if (userJson != null) {
        _user = User.fromJson(jsonDecode(userJson));
      } else if (_isAuthenticated) {
        // Fetch user from API
        final response = await _apiService.get<User>(
          AppConstants.apiUsersMe,
          fromJson: (json) => User.fromJson(json),
        );
        
        if (response.success && response.data != null) {
          _user = response.data;
          await _saveUserData();
        }
      }
    } catch (e) {
      debugPrint('Error loading user: $e');
    } finally {
      notifyListeners();
    }
  }

  // Save user data
  Future<void> _saveUserData() async {
    if (_user != null) {
      await _prefs.setString(
        AppConstants.kUserData,
        jsonEncode(_user!.toJson()),
      );
    }
  }

  // Login
  Future<bool> login({
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        AppConstants.apiAuthLogin,
        data: {
          'phone': phone,
          'password': password,
          'device_token': _prefs.getString(AppConstants.kDeviceToken),
        },
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Save tokens
        _token = data['access_token'] as String?;
        _refreshToken = data['refresh_token'] as String?;
        
        await _prefs.setString(AppConstants.kAuthToken, _token!);
        await _prefs.setString(AppConstants.kRefreshToken, _refreshToken!);
        await _prefs.setBool(AppConstants.kIsLoggedIn, true);
        
        // Save user data
        if (data['user'] != null) {
          _user = User.fromJson(data['user'] as Map<String, dynamic>);
          await _saveUserData();
        }
        
        _isAuthenticated = true;
        _isOnboarded = data['is_onboarded'] as bool? ?? false;
        await _prefs.setBool(AppConstants.kIsOnboarded, _isOnboarded);
        
        // Set auth token in API service
        _apiService.setAuthToken(_token!);
        
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Login failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Login error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login with OTP
  Future<bool> loginWithOtp(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        AppConstants.apiAuthLogin,
        data: {
          'phone': phone,
          'method': 'otp',
          'device_token': _prefs.getString(AppConstants.kDeviceToken),
        },
      );

      if (response.success && response.data != null) {
        // OTP sent successfully
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Failed to send OTP';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Login with OTP error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Verify OTP
  Future<bool> verifyOtp(String phone, String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        AppConstants.apiAuthVerifyOtp,
        data: {
          'phone': phone,
          'otp': otp,
          'device_token': _prefs.getString(AppConstants.kDeviceToken),
        },
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Save tokens
        _token = data['access_token'] as String?;
        _refreshToken = data['refresh_token'] as String?;
        
        await _prefs.setString(AppConstants.kAuthToken, _token!);
        await _prefs.setString(AppConstants.kRefreshToken, _refreshToken!);
        await _prefs.setBool(AppConstants.kIsLoggedIn, true);
        
        // Save user data
        if (data['user'] != null) {
          _user = User.fromJson(data['user'] as Map<String, dynamic>);
          await _saveUserData();
        }
        
        _isAuthenticated = true;
        _isOnboarded = data['is_onboarded'] as bool? ?? false;
        await _prefs.setBool(AppConstants.kIsOnboarded, _isOnboarded);
        
        // Set auth token in API service
        _apiService.setAuthToken(_token!);
        
        return true;
      } else {
        _error = response.error ?? response.message ?? 'OTP verification failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Verify OTP error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register
  Future<bool> register({
    required String name,
    required String phone,
    required String password,
    String? email,
    String? shopName,
    String? businessType,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post<Map<String, dynamic>>(
        AppConstants.apiAuthRegister,
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          'email': email,
          'shop_name': shopName,
          'business_type': businessType,
          'device_token': _prefs.getString(AppConstants.kDeviceToken),
        },
      );

      if (response.success && response.data != null) {
        final data = response.data!;
        
        // Save tokens
        _token = data['access_token'] as String?;
        _refreshToken = data['refresh_token'] as String?;
        
        await _prefs.setString(AppConstants.kAuthToken, _token!);
        await _prefs.setString(AppConstants.kRefreshToken, _refreshToken!);
        await _prefs.setBool(AppConstants.kIsLoggedIn, true);
        
        // Save user data
        if (data['user'] != null) {
          _user = User.fromJson(data['user'] as Map<String, dynamic>);
          await _saveUserData();
        }
        
        _isAuthenticated = true;
        _isOnboarded = data['is_onboarded'] as bool? ?? false;
        await _prefs.setBool(AppConstants.kIsOnboarded, _isOnboarded);
        
        // Set auth token in API service
        _apiService.setAuthToken(_token!);
        
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Registration failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Registration error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Forgot password
  Future<bool> forgotPassword(String phone) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        AppConstants.apiAuthForgotPassword,
        data: {'phone': phone},
      );

      if (response.success) {
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Failed to send reset link';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Forgot password error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Reset password
  Future<bool> resetPassword({
    required String phone,
    required String otp,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        AppConstants.apiAuthResetPassword,
        data: {
          'phone': phone,
          'otp': otp,
          'new_password': newPassword,
        },
      );

      if (response.success) {
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Password reset failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Reset password error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout
  Future<bool> logout() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Call logout API
      await _apiService.post(AppConstants.apiAuthLogout);
    } catch (e) {
      debugPrint('Logout API error: $e');
    }

    // Clear local data
    await _prefs.remove(AppConstants.kAuthToken);
    await _prefs.remove(AppConstants.kRefreshToken);
    await _prefs.remove(AppConstants.kUserData);
    await _prefs.setBool(AppConstants.kIsLoggedIn, false);
    
    _token = null;
    _refreshToken = null;
    _user = null;
    _isAuthenticated = false;
    _isOnboarded = false;
    
    // Clear API service token
    _apiService.clearAuthToken();
    
    notifyListeners();
    return true;
  }

  // Refresh token
  Future<bool> refreshToken() async {
    if (_refreshToken == null) return false;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.refreshTokenApi(_refreshToken!);
      
      if (response != null) {
        _token = response['access_token'] as String?;
        _refreshToken = response['refresh_token'] as String?;
        
        await _prefs.setString(AppConstants.kAuthToken, _token!);
        await _prefs.setString(AppConstants.kRefreshToken, _refreshToken!);
        
        // Set new token in API service
        _apiService.setAuthToken(_token!);
        
        return true;
      }
      
      return false;
    } catch (e) {
      _error = e.toString();
      debugPrint('Refresh token error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update profile
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put<User>(
        AppConstants.apiUsersProfile,
        data: data,
        fromJson: (json) => User.fromJson(json),
      );

      if (response.success && response.data != null) {
        _user = response.data;
        await _saveUserData();
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Profile update failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Update profile error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update password
  Future<bool> updatePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put(
        '/api/users/password',
        data: {
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      );

      if (response.success) {
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Password update failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Update password error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Complete onboarding
  Future<bool> completeOnboarding() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/api/users/onboarding',
        data: {'is_onboarded': true},
      );

      if (response.success) {
        _isOnboarded = true;
        await _prefs.setBool(AppConstants.kIsOnboarded, true);
        return true;
      } else {
        _error = response.error ?? response.message ?? 'Onboarding failed';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      debugPrint('Complete onboarding error: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get user by ID
  Future<User?> getUser(String userId) async {
    try {
      final response = await _apiService.get<User>(
        '/api/users/$userId',
        fromJson: (json) => User.fromJson(json),
      );

      if (response.success && response.data != null) {
        return response.data;
      }
      return null;
    } catch (e) {
      debugPrint('Get user error: $e');
      return null;
    }
  }

  // Check if user exists
  Future<bool> userExists(String phone) async {
    try {
      final response = await _apiService.get(
        '/api/users/check?phone=$phone',
      );

      if (response.success) {
        return response.data['exists'] as bool? ?? false;
      }
      return false;
    } catch (e) {
      debugPrint('User exists error: $e');
      return false;
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Check authentication
  Future<bool> checkAuth() async {
    if (_isAuthenticated && _token != null) {
      // Verify token is still valid
      try {
        final response = await _apiService.get(AppConstants.apiHealth);
        return response.success;
      } catch (e) {
        // Token might be expired, try to refresh
        final refreshed = await refreshToken();
        if (refreshed) {
          return true;
        }
        // Clear auth if refresh fails
        await logout();
        return false;
      }
    }
    return false;
  }
}
