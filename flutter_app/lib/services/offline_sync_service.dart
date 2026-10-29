import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:vendor_saathi/services/api_service.dart';
import 'package:vendor_saathi/models/product_model.dart';
import 'package:vendor_saathi/models/order_model.dart';
import 'package:vendor_saathi/models/payment_model.dart';
import 'package:vendor_saathi/models/udhaar_model.dart';
import 'package:vendor_saathi/utils/constants.dart';

class OfflineSyncService with ChangeNotifier {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  final ApiService _apiService = ApiService();
  final Connectivity _connectivity = Connectivity();

  // Sync state
  bool _isSyncing = false;
  bool _isOnline = false;
  bool _hasConnectivity = false;
  String? _syncStatus;
  String? _error;
  DateTime? _lastSyncTime;
  
  // Pending operations
  List<SyncOperation> _pendingOperations = [];
  List<SyncOperation> _failedOperations = [];
  
  // Data boxes
  late Box<Product> _productsBox;
  late Box<Order> _ordersBox;
  late Box<Payment> _paymentsBox;
  late Box<Udhaar> _udhaarBox;

  // Getters
  bool get isSyncing => _isSyncing;
  bool get isOnline => _isOnline;
  bool get hasConnectivity => _hasConnectivity;
  String? get syncStatus => _syncStatus;
  String? get error => _error;
  DateTime? get lastSyncTime => _lastSyncTime;
  List<SyncOperation> get pendingOperations => _pendingOperations;
  List<SyncOperation> get failedOperations => _failedOperations;

  // Initialize
  Future<void> initialize() async {
    await _initializeBoxes();
    await _checkConnectivity();
    await _loadPendingOperations();
    
    // Start listening for connectivity changes
    _connectivity.onConnectivityChanged.listen((result) async {
      await _onConnectivityChanged(result);
    });
  }

  // Initialize Hive boxes
  Future<void> _initializeBoxes() async {
    _productsBox = Hive.box<Product>(kProductsBox);
    _ordersBox = Hive.box<Order>(kOrdersBox);
    _paymentsBox = Hive.box<Payment>(kPaymentsBox);
    _udhaarBox = Hive.box<Udhaar>(kUdhaarBox);
  }

  // Check connectivity
  Future<void> _checkConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      await _onConnectivityChanged(result);
    } catch (e) {
      debugPrint('Error checking connectivity: $e');
      _hasConnectivity = false;
      _isOnline = false;
      notifyListeners();
    }
  }

  // On connectivity changed
  Future<void> _onConnectivityChanged(ConnectivityResult result) async {
    _hasConnectivity = result != ConnectivityResult.none;
    
    // Check if we can actually reach the internet
    if (_hasConnectivity) {
      try {
        // Try to ping the API
        final response = await _apiService.get('/api/health');
        _isOnline = response.success;
      } catch (e) {
        _isOnline = false;
      }
    } else {
      _isOnline = false;
    }
    
    // If we just came online, trigger sync
    if (_isOnline && !_isSyncing) {
      await syncAll();
    }
    
    notifyListeners();
  }

  // Load pending operations from storage
  Future<void> _loadPendingOperations() async {
    final box = await Hive.openBox<SyncOperation>('sync_operations');
    _pendingOperations = box.values.toList();
    
    // Separate failed operations
    _failedOperations = _pendingOperations
        .where((op) => op.status == SyncStatus.failed)
        .toList();
    
    notifyListeners();
  }

  // Save pending operation
  Future<void> _savePendingOperation(SyncOperation operation) async {
    final box = await Hive.openBox<SyncOperation>('sync_operations');
    await box.add(operation);
    _pendingOperations.add(operation);
    notifyListeners();
  }

  // Update pending operation
  Future<void> _updatePendingOperation(SyncOperation operation) async {
    final box = await Hive.openBox<SyncOperation>('sync_operations');
    
    // Find the operation in the box
    final key = box.keys.firstWhere(
      (key) => box.get(key)?.id == operation.id,
      orElse: () => null,
    );
    
    if (key != null) {
      await box.put(key, operation);
    }
    
    // Update in memory
    final index = _pendingOperations.indexWhere((op) => op.id == operation.id);
    if (index != -1) {
      _pendingOperations[index] = operation;
    }
    
    notifyListeners();
  }

  // Remove pending operation
  Future<void> _removePendingOperation(String operationId) async {
    final box = await Hive.openBox<SyncOperation>('sync_operations');
    
    // Find and remove from box
    final key = box.keys.firstWhere(
      (key) => box.get(key)?.id == operationId,
      orElse: () => null,
    );
    
    if (key != null) {
      await box.delete(key);
    }
    
    // Remove from memory
    _pendingOperations.removeWhere((op) => op.id == operationId);
    _failedOperations.removeWhere((op) => op.id == operationId);
    
    notifyListeners();
  }

  // Sync all data
  Future<void> syncAll() async {
    if (_isSyncing) return;
    
    _isSyncing = true;
    _syncStatus = 'Syncing...';
    _error = null;
    notifyListeners();
    
    try {
      // Sync products
      await syncProducts();
      
      // Sync orders
      await syncOrders();
      
      // Sync payments
      await syncPayments();
      
      // Sync udhaar
      await syncUdhaar();
      
      // Process pending operations
      await _processPendingOperations();
      
      _syncStatus = 'Sync completed';
      _lastSyncTime = DateTime.now();
    } catch (e) {
      _syncStatus = 'Sync failed';
      _error = e.toString();
      debugPrint('Error syncing all: $e');
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  // Sync products
  Future<void> syncProducts() async {
    if (!_isOnline) return;
    
    try {
      // Get all products from local storage
      final localProducts = _productsBox.values
          .where((p) => p.isSynced == false || p.isSynced == null)
          .toList();
      
      // Upload unsynced products
      for (final product in localProducts) {
        final operation = SyncOperation(
          id: 'prod_${product.id}_${DateTime.now().millisecondsSinceEpoch}',
          type: SyncType.create,
          entityType: EntityType.product,
          entityId: product.id,
          data: product.toJson(),
          status: SyncStatus.pending,
          timestamp: DateTime.now(),
          retries: 0,
        );
        
        await _savePendingOperation(operation);
      }
      
      // Download latest products from server
      final response = await _apiService.get<List<dynamic>>(
        '/api/products',
        fromJson: (json) {
          return (json as List).map((e) => Product.fromJson(e)).toList();
        },
      );
      
      if (response.success && response.data != null) {
        // Save to local storage
        final productsBox = Hive.box<Product>(kProductsBox);
        for (final product in response.data!) {
          await productsBox.put(product.id, product.copyWith(
            isSynced: true,
            lastSyncedAt: DateTime.now(),
          ));
        }
      }
    } catch (e) {
      debugPrint('Error syncing products: $e');
      rethrow;
    }
  }

  // Sync orders
  Future<void> syncOrders() async {
    if (!_isOnline) return;
    
    try {
      // Get all orders from local storage
      final localOrders = _ordersBox.values
          .where((o) => o.isSynced == false || o.isSynced == null)
          .toList();
      
      // Upload unsynced orders
      for (final order in localOrders) {
        final operation = SyncOperation(
          id: 'order_${order.id}_${DateTime.now().millisecondsSinceEpoch}',
          type: SyncType.create,
          entityType: EntityType.order,
          entityId: order.id,
          data: order.toJson(),
          status: SyncStatus.pending,
          timestamp: DateTime.now(),
          retries: 0,
        );
        
        await _savePendingOperation(operation);
      }
      
      // Download latest orders from server
      final response = await _apiService.get<List<dynamic>>(
        '/api/orders',
        fromJson: (json) {
          return (json as List).map((e) => Order.fromJson(e)).toList();
        },
      );
      
      if (response.success && response.data != null) {
        // Save to local storage
        final ordersBox = Hive.box<Order>(kOrdersBox);
        for (final order in response.data!) {
          await ordersBox.put(order.id, order.copyWith(
            isSynced: true,
            lastSyncedAt: DateTime.now(),
          ));
        }
      }
    } catch (e) {
      debugPrint('Error syncing orders: $e');
      rethrow;
    }
  }

  // Sync payments
  Future<void> syncPayments() async {
    if (!_isOnline) return;
    
    try {
      // Get all payments from local storage
      final localPayments = _paymentsBox.values
          .where((p) => p.isSynced == false || p.isSynced == null)
          .toList();
      
      // Upload unsynced payments
      for (final payment in localPayments) {
        final operation = SyncOperation(
          id: 'pay_${payment.id}_${DateTime.now().millisecondsSinceEpoch}',
          type: SyncType.create,
          entityType: EntityType.payment,
          entityId: payment.id,
          data: payment.toJson(),
          status: SyncStatus.pending,
          timestamp: DateTime.now(),
          retries: 0,
        );
        
        await _savePendingOperation(operation);
      }
      
      // Download latest payments from server
      final response = await _apiService.get<List<dynamic>>(
        '/api/payments',
        fromJson: (json) {
          return (json as List).map((e) => Payment.fromJson(e)).toList();
        },
      );
      
      if (response.success && response.data != null) {
        // Save to local storage
        final paymentsBox = Hive.box<Payment>(kPaymentsBox);
        for (final payment in response.data!) {
          await paymentsBox.put(payment.id, payment.copyWith(
            isSynced: true,
            lastSyncedAt: DateTime.now(),
          ));
        }
      }
    } catch (e) {
      debugPrint('Error syncing payments: $e');
      rethrow;
    }
  }

  // Sync Udhaar
  Future<void> syncUdhaar() async {
    if (!_isOnline) return;
    
    try {
      // Get all udhaar from local storage
      final localUdhaar = _udhaarBox.values
          .where((u) => u.isSynced == false || u.isSynced == null)
          .toList();
      
      // Upload unsynced udhaar
      for (final udhaar in localUdhaar) {
        final operation = SyncOperation(
          id: 'udhaar_${udhaar.id}_${DateTime.now().millisecondsSinceEpoch}',
          type: SyncType.create,
          entityType: EntityType.udhaar,
          entityId: udhaar.id,
          data: udhaar.toJson(),
          status: SyncStatus.pending,
          timestamp: DateTime.now(),
          retries: 0,
        );
        
        await _savePendingOperation(operation);
      }
      
      // Download latest udhaar from server
      final response = await _apiService.get<List<dynamic>>(
        '/api/udhaar',
        fromJson: (json) {
          return (json as List).map((e) => Udhaar.fromJson(e)).toList();
        },
      );
      
      if (response.success && response.data != null) {
        // Save to local storage
        final udhaarBox = Hive.box<Udhaar>(kUdhaarBox);
        for (final udhaar in response.data!) {
          await udhaarBox.put(udhaar.id, udhaar.copyWith(
            isSynced: true,
            lastSyncedAt: DateTime.now(),
          ));
        }
      }
    } catch (e) {
      debugPrint('Error syncing udhaar: $e');
      rethrow;
    }
  }

  // Process pending operations
  Future<void> _processPendingOperations() async {
    if (!_isOnline) return;
    
    for (final operation in _pendingOperations) {
      if (operation.status == SyncStatus.completed || 
          operation.status == SyncStatus.failed) {
        continue;
      }
      
      try {
        // Mark as processing
        operation.status = SyncStatus.processing;
        await _updatePendingOperation(operation);
        
        // Process based on type
        switch (operation.type) {
          case SyncType.create:
            await _processCreate(operation);
            break;
          case SyncType.update:
            await _processUpdate(operation);
            break;
          case SyncType.delete:
            await _processDelete(operation);
            break;
        }
        
        // Mark as completed
        operation.status = SyncStatus.completed;
        await _updatePendingOperation(operation);
        
        // Remove from pending
        await _removePendingOperation(operation.id!);
        
      } catch (e) {
        debugPrint('Error processing operation ${operation.id}: $e');
        
        // Increment retry count
        operation.retries = (operation.retries ?? 0) + 1;
        operation.error = e.toString();
        
        // Mark as failed if max retries reached
        if (operation.retries! >= 3) {
          operation.status = SyncStatus.failed;
          await _updatePendingOperation(operation);
        } else {
          operation.status = SyncStatus.pending;
          await _updatePendingOperation(operation);
        }
      }
    }
  }

  // Process create operation
  Future<void> _processCreate(SyncOperation operation) async {
    switch (operation.entityType) {
      case EntityType.product:
        final product = Product.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.post<Product>(
          '/api/products',
          data: product.toJson(),
          fromJson: (json) => Product.fromJson(json),
        );
        
        if (response.success && response.data != null) {
          // Update local storage with server ID
          final productsBox = Hive.box<Product>(kProductsBox);
          await productsBox.put(
            response.data!.id,
            response.data!.copyWith(
              isSynced: true,
              lastSyncedAt: DateTime.now(),
            ),
          );
        } else {
          throw Exception(response.error ?? 'Failed to create product');
        }
        break;
        
      case EntityType.order:
        final order = Order.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.post<Order>(
          '/api/orders',
          data: order.toJson(),
          fromJson: (json) => Order.fromJson(json),
        );
        
        if (response.success && response.data != null) {
          // Update local storage with server ID
          final ordersBox = Hive.box<Order>(kOrdersBox);
          await ordersBox.put(
            response.data!.id,
            response.data!.copyWith(
              isSynced: true,
              lastSyncedAt: DateTime.now(),
            ),
          );
        } else {
          throw Exception(response.error ?? 'Failed to create order');
        }
        break;
        
      case EntityType.payment:
        final payment = Payment.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.post<Payment>(
          '/api/payments',
          data: payment.toJson(),
          fromJson: (json) => Payment.fromJson(json),
        );
        
        if (response.success && response.data != null) {
          // Update local storage with server ID
          final paymentsBox = Hive.box<Payment>(kPaymentsBox);
          await paymentsBox.put(
            response.data!.id,
            response.data!.copyWith(
              isSynced: true,
              lastSyncedAt: DateTime.now(),
            ),
          );
        } else {
          throw Exception(response.error ?? 'Failed to create payment');
        }
        break;
        
      case EntityType.udhaar:
        final udhaar = Udhaar.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.post<Udhaar>(
          '/api/udhaar',
          data: udhaar.toJson(),
          fromJson: (json) => Udhaar.fromJson(json),
        );
        
        if (response.success && response.data != null) {
          // Update local storage with server ID
          final udhaarBox = Hive.box<Udhaar>(kUdhaarBox);
          await udhaarBox.put(
            response.data!.id,
            response.data!.copyWith(
              isSynced: true,
              lastSyncedAt: DateTime.now(),
            ),
          );
        } else {
          throw Exception(response.error ?? 'Failed to create udhaar');
        }
        break;
        
      default:
        break;
    }
  }

  // Process update operation
  Future<void> _processUpdate(SyncOperation operation) async {
    switch (operation.entityType) {
      case EntityType.product:
        final product = Product.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.put<Product>(
          '/api/products/${product.id}',
          data: product.toJson(),
          fromJson: (json) => Product.fromJson(json),
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to update product');
        }
        break;
        
      case EntityType.order:
        final order = Order.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.put<Order>(
          '/api/orders/${order.id}',
          data: order.toJson(),
          fromJson: (json) => Order.fromJson(json),
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to update order');
        }
        break;
        
      case EntityType.payment:
        final payment = Payment.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.put<Payment>(
          '/api/payments/${payment.id}',
          data: payment.toJson(),
          fromJson: (json) => Payment.fromJson(json),
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to update payment');
        }
        break;
        
      case EntityType.udhaar:
        final udhaar = Udhaar.fromJson(operation.data as Map<String, dynamic>);
        final response = await _apiService.put<Udhaar>(
          '/api/udhaar/${udhaar.id}',
          data: udhaar.toJson(),
          fromJson: (json) => Udhaar.fromJson(json),
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to update udhaar');
        }
        break;
        
      default:
        break;
    }
  }

  // Process delete operation
  Future<void> _processDelete(SyncOperation operation) async {
    switch (operation.entityType) {
      case EntityType.product:
        final response = await _apiService.delete(
          '/api/products/${operation.entityId}',
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to delete product');
        }
        break;
        
      case EntityType.order:
        final response = await _apiService.delete(
          '/api/orders/${operation.entityId}',
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to delete order');
        }
        break;
        
      case EntityType.payment:
        final response = await _apiService.delete(
          '/api/payments/${operation.entityId}',
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to delete payment');
        }
        break;
        
      case EntityType.udhaar:
        final response = await _apiService.delete(
          '/api/udhaar/${operation.entityId}',
        );
        
        if (!response.success) {
          throw Exception(response.error ?? 'Failed to delete udhaar');
        }
        break;
        
      default:
        break;
    }
  }

  // Add operation to queue
  Future<void> addOperation(SyncOperation operation) async {
    await _savePendingOperation(operation);
    
    // If online, process immediately
    if (_isOnline && !_isSyncing) {
      await syncAll();
    }
  }

  // Retry failed operations
  Future<void> retryFailedOperations() async {
    for (final operation in _failedOperations) {
      operation.status = SyncStatus.pending;
      operation.retries = 0;
      operation.error = null;
      await _updatePendingOperation(operation);
    }
    
    _failedOperations.clear();
    
    if (_isOnline) {
      await syncAll();
    }
  }

  // Clear all pending operations
  Future<void> clearPendingOperations() async {
    final box = await Hive.openBox<SyncOperation>('sync_operations');
    await box.clear();
    _pendingOperations.clear();
    _failedOperations.clear();
    notifyListeners();
  }

  // Force sync
  Future<void> forceSync() async {
    await syncAll();
  }

  // Get sync status for a specific entity
  Future<SyncStatus?> getSyncStatus(String entityType, String entityId) async {
    final box = await Hive.openBox<SyncOperation>('sync_operations');
    
    for (final operation in box.values) {
      if (operation.entityType == entityType && operation.entityId == entityId) {
        return operation.status;
      }
    }
    
    return null;
  }

  // Dispose
  @override
  void dispose() {
    _positionStream?.cancel();
    super.dispose();
  }
}

// Sync Operation Model
@freezed
class SyncOperation with _$SyncOperation {
  const factory SyncOperation({
    String? id,
    SyncType? type,
    EntityType? entityType,
    String? entityId,
    Map<String, dynamic>? data,
    SyncStatus? status,
    DateTime? timestamp,
    DateTime? processedAt,
    int? retries,
    String? error,
    Map<String, dynamic>? metadata,
  }) = _SyncOperation;

  factory SyncOperation.fromJson(Map<String, dynamic> json) => 
      _$SyncOperationFromJson(json);
}

// Enums
enum SyncType {
  create,
  update,
  delete,
}

enum EntityType {
  product,
  order,
  payment,
  udhaar,
  customer,
  route,
  user,
  settings,
}

enum SyncStatus {
  pending,
  processing,
  completed,
  failed,
}
