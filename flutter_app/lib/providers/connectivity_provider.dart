import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/offline_sync_service.dart';

class ConnectivityProvider with ChangeNotifier {
  bool _isOnline = true;
  StreamSubscription<ConnectivityResult>? _sub;

  bool get isOnline => _isOnline;

  ConnectivityProvider() {
    _init();
  }

  Future<void> _init() async {
    final initial = await Connectivity().checkConnectivity();
    _isOnline = initial != ConnectivityResult.none;
    notifyListeners();

    _sub = Connectivity().onConnectivityChanged.listen((result) {
      final nowOnline = result != ConnectivityResult.none;
      if (!_isOnline && nowOnline) {
        OfflineSyncService.instance.syncPendingOperations();
      }
      _isOnline = nowOnline;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
