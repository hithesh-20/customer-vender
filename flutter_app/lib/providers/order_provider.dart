import 'package:flutter/material.dart';
import 'package:vendor_saathi/models/order_model.dart';
import 'package:vendor_saathi/services/api_service.dart';
import 'package:vendor_saathi/services/offline_sync_service.dart';

class OrderProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  List<Order> _orders = [];
  bool _isLoading = false;
  String? _error;

  List<Order> get orders => _orders;
  List<Order> get pendingOrders => _orders
      .where((o) => ['Pending', 'Accepted', 'Prepared', 'On the Way'].contains(o.status))
      .toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchOrders() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _api.get<List<Order>>(
        '/orders/me',
        fromJson: (json) => (json as List)
            .map((item) => Order.fromJson(Map<String, dynamic>.from(item)))
            .toList(),
      );
      if (response.success && response.data != null) {
        _orders = response.data!;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createOrder(Map<String, dynamic> payload) async {
    try {
      final response = await _api.post<Order>(
        '/orders',
        data: payload,
        fromJson: (json) => Order.fromJson(Map<String, dynamic>.from(json)),
      );
      if (response.success && response.data != null) {
        _orders.insert(0, response.data!);
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      await OfflineSyncService.instance.queueOperation('create_order', payload);
      return false;
    }
  }

  Future<bool> updateOrderStatus(String orderId, String status) async {
    try {
      final response = await _api.patch<Order>(
        '/orders/$orderId/status',
        data: {'status': status},
        fromJson: (json) => Order.fromJson(Map<String, dynamic>.from(json)),
      );
      if (response.success && response.data != null) {
        final idx = _orders.indexWhere((o) => o.id == orderId);
        if (idx != -1) _orders[idx] = response.data!;
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
