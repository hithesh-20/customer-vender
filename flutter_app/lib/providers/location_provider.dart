import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/api_service.dart';
import 'package:vendor_saathi/services/location_service.dart';

class LocationProvider with ChangeNotifier {
  final LocationService _locationService = LocationService();
  final ApiService _api = ApiService();

  double _latitude = 13.0827;
  double _longitude = 74.9945;
  Map<String, dynamic>? _activeOptimization;
  bool _isOptimizing = false;

  double get latitude => _latitude;
  double get longitude => _longitude;
  Map<String, dynamic>? get activeOptimization => _activeOptimization;
  bool get isOptimizing => _isOptimizing;

  Future<void> refreshPosition() async {
    final pos = await _locationService.getCurrentPosition();
    if (pos != null) {
      _latitude = pos.latitude;
      _longitude = pos.longitude;
      notifyListeners();
    }
  }

  Future<void> optimizeActiveOrders({String vehicleType = 'Two-Wheeler'}) async {
    _isOptimizing = true;
    notifyListeners();
    try {
      final response = await _api.post<Map<String, dynamic>>(
        '/routes/from-pending-orders',
        data: {'vehicleType': vehicleType},
        fromJson: (json) => Map<String, dynamic>.from(json),
      );
      if (response.success && response.data != null) {
        _activeOptimization = response.data;
      }
    } catch (_) {
    } finally {
      _isOptimizing = false;
      notifyListeners();
    }
  }
}
