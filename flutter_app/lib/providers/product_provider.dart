import 'package:flutter/material.dart';
import 'package:vendor_saathi/models/product_model.dart';
import 'package:vendor_saathi/services/api_service.dart';
import 'package:vendor_saathi/services/offline_sync_service.dart';

class ProductProvider with ChangeNotifier {
  final ApiService _api = ApiService();
  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;
  String _selectedCategory = 'All';

  List<Product> get products => _selectedCategory == 'All'
      ? _products
      : _products.where((p) => p.category == _selectedCategory).toList();

  List<Product> get lowStockProducts =>
      _products.where((p) => p.stock <= (p.minStock ?? 5)).toList();

  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedCategory => _selectedCategory;

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<void> fetchProducts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _api.get<List<Product>>(
        '/products/me',
        fromJson: (json) => (json as List)
            .map((item) => Product.fromJson(Map<String, dynamic>.from(item)))
            .toList(),
      );
      if (response.success && response.data != null) {
        _products = response.data!;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addProduct(Map<String, dynamic> payload) async {
    try {
      final response = await _api.post<Product>(
        '/products',
        data: payload,
        fromJson: (json) => Product.fromJson(Map<String, dynamic>.from(json)),
      );
      if (response.success && response.data != null) {
        _products.insert(0, response.data!);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      await OfflineSyncService.instance.queueOperation('create_product', payload);
      return false;
    }
  }

  Future<bool> adjustStock(String productId, double delta) async {
    try {
      final response = await _api.patch<Product>(
        '/products/$productId/stock',
        data: {'adjustment': delta, 'reason': 'Mobile stock update'},
        fromJson: (json) => Product.fromJson(Map<String, dynamic>.from(json)),
      );
      if (response.success && response.data != null) {
        final idx = _products.indexWhere((p) => p.id == productId);
        if (idx != -1) _products[idx] = response.data!;
        notifyListeners();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}
