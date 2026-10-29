import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:vendor_saathi/models/route_model.dart';
import 'package:vendor_saathi/models/order_model.dart';
import 'package:vendor_saathi/utils/constants.dart';

class LocationService with ChangeNotifier {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  // Location state
  Position? _currentPosition;
  Location? _currentLocation;
  bool _isLoading = false;
  bool _isLocationEnabled = false;
  bool _hasPermission = false;
  String? _error;

  // Tracking state
  bool _isTracking = false;
  StreamSubscription<Position>? _positionStream;
  List<Position> _positionHistory = [];
  
  // Route tracking
  Route? _currentRoute;
  List<RouteStop> _currentStops = [];
  RouteStop? _currentStop;
  int _currentStopIndex = -1;

  // Getters
  Position? get currentPosition => _currentPosition;
  Location? get currentLocation => _currentLocation;
  bool get isLoading => _isLoading;
  bool get isLocationEnabled => _isLocationEnabled;
  bool get hasPermission => _hasPermission;
  String? get error => _error;
  bool get isTracking => _isTracking;
  List<Position> get positionHistory => _positionHistory;
  Route? get currentRoute => _currentRoute;
  List<RouteStop> get currentStops => _currentStops;
  RouteStop? get currentStop => _currentStop;
  int get currentStopIndex => _currentStopIndex;

  // Google Maps controller
  GoogleMapController? _mapController;
  GoogleMapController? get mapController => _mapController;
  
  set mapController(GoogleMapController? controller) {
    _mapController = controller;
    notifyListeners();
  }

  // Initialize
  Future<void> initialize() async {
    await _checkLocationPermission();
    await _checkLocationService();
  }

  // Check location permission
  Future<bool> _checkLocationPermission() async {
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _hasPermission = false;
          _error = 'Location permission denied';
          return false;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        _hasPermission = false;
        _error = 'Location permission denied forever';
        return false;
      }
      
      _hasPermission = true;
      _error = null;
      return true;
    } catch (e) {
      _hasPermission = false;
      _error = e.toString();
      debugPrint('Error checking location permission: $e');
      return false;
    } finally {
      notifyListeners();
    }
  }

  // Check if location service is enabled
  Future<bool> _checkLocationService() async {
    try {
      _isLocationEnabled = await Geolocator.isLocationServiceEnabled();
      return _isLocationEnabled;
    } catch (e) {
      _isLocationEnabled = false;
      _error = e.toString();
      debugPrint('Error checking location service: $e');
      return false;
    } finally {
      notifyListeners();
    }
  }

  // Request location permission
  Future<bool> requestPermission() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      LocationPermission permission = await Geolocator.requestPermission();
      
      if (permission == LocationPermission.denied || 
          permission == LocationPermission.deniedForever) {
        _hasPermission = false;
        _error = 'Location permission denied';
        return false;
      }
      
      _hasPermission = true;
      _error = null;
      return true;
    } catch (e) {
      _hasPermission = false;
      _error = e.toString();
      debugPrint('Error requesting location permission: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Request to enable location service
  Future<bool> requestLocationService() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _isLocationEnabled = await Geolocator.isLocationServiceEnabled();
      
      if (!_isLocationEnabled) {
        // Open location settings
        bool opened = await Geolocator.openLocationSettings();
        if (!opened) {
          _error = 'Could not open location settings';
          return false;
        }
        
        // Wait a bit and check again
        await Future.delayed(const Duration(seconds: 2));
        _isLocationEnabled = await Geolocator.isLocationServiceEnabled();
        
        if (!_isLocationEnabled) {
          _error = 'Location service not enabled';
          return false;
        }
      }
      
      _error = null;
      return true;
    } catch (e) {
      _isLocationEnabled = false;
      _error = e.toString();
      debugPrint('Error enabling location service: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get current position
  Future<Position?> getCurrentPosition() async {
    if (!_hasPermission) {
      bool granted = await requestPermission();
      if (!granted) return null;
    }
    
    if (!_isLocationEnabled) {
      bool enabled = await requestLocationService();
      if (!enabled) return null;
    }
    
    _isLoading = true;
    notifyListeners();
    
    try {
      _currentPosition = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10,
          timeLimit: const Duration(seconds: 10),
        ),
      );
      
      // Convert to Location model
      _currentLocation = Location(
        latitude: _currentPosition!.latitude,
        longitude: _currentPosition!.longitude,
        address: '',
        timestamp: DateTime.now(),
        accuracy: _currentPosition!.accuracy,
        altitude: _currentPosition!.altitude,
        speed: _currentPosition!.speed,
        bearing: _currentPosition!.heading,
      );
      
      // Reverse geocode to get address
      await _reverseGeocode(_currentPosition!);
      
      _error = null;
      return _currentPosition;
    } catch (e) {
      _error = e.toString();
      debugPrint('Error getting current position: $e');
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get last known position
  Future<Position?> getLastKnownPosition() async {
    try {
      _currentPosition = await Geolocator.getLastKnownPosition();
      
      if (_currentPosition != null) {
        _currentLocation = Location(
          latitude: _currentPosition!.latitude,
          longitude: _currentPosition!.longitude,
          address: '',
          timestamp: DateTime.now(),
          accuracy: _currentPosition!.accuracy,
        );
        await _reverseGeocode(_currentPosition!);
      }
      
      return _currentPosition;
    } catch (e) {
      debugPrint('Error getting last known position: $e');
      return null;
    } finally {
      notifyListeners();
    }
  }

  // Start tracking location
  Future<void> startTracking({
    Duration? interval,
    int? distanceFilter,
    Function(Position)? onLocationUpdate,
  }) async {
    if (!_hasPermission) {
      bool granted = await requestPermission();
      if (!granted) return;
    }
    
    if (!_isLocationEnabled) {
      bool enabled = await requestLocationService();
      if (!enabled) return;
    }
    
    if (_isTracking) return;
    
    _isTracking = true;
    _positionHistory.clear();
    notifyListeners();
    
    try {
      final locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: distanceFilter ?? 10,
        timeInterval: interval ?? const Duration(seconds: 5),
      );
      
      _positionStream = Geolocator.getPositionStream(
        locationSettings: locationSettings,
      ).listen((Position position) {
        _currentPosition = position;
        _positionHistory.add(position);
        
        // Keep only last 100 positions
        if (_positionHistory.length > 100) {
          _positionHistory.removeAt(0);
        }
        
        _currentLocation = Location(
          latitude: position.latitude,
          longitude: position.longitude,
          timestamp: DateTime.now(),
          accuracy: position.accuracy,
          altitude: position.altitude,
          speed: position.speed,
          bearing: position.heading,
        );
        
        if (onLocationUpdate != null) {
          onLocationUpdate(position);
        }
        
        // Update map camera if tracking route
        if (_currentRoute != null && _mapController != null) {
          _updateMapCamera();
        }
        
        notifyListeners();
      });
    } catch (e) {
      _isTracking = false;
      _error = e.toString();
      debugPrint('Error starting location tracking: $e');
      notifyListeners();
    }
  }

  // Stop tracking
  Future<void> stopTracking() async {
    if (!_isTracking) return;
    
    await _positionStream?.cancel();
    _positionStream = null;
    _isTracking = false;
    notifyListeners();
  }

  // Reverse geocode
  Future<void> _reverseGeocode(Position position) async {
    try {
      // In a real app, you would use a geocoding API
      // For now, we'll use a simple placeholder
      // You can integrate with Google Maps Geocoding API or other services
      
      // This is a placeholder - implement actual geocoding
      final address = await _getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );
      
      if (_currentLocation != null) {
        _currentLocation = _currentLocation!.copyWith(
          address: address,
        );
      }
    } catch (e) {
      debugPrint('Error reverse geocoding: $e');
    }
  }

  // Get address from coordinates (placeholder - implement actual API call)
  Future<String> _getAddressFromCoordinates(double lat, double lng) async {
    // In production, use Google Maps Geocoding API
    // or other geocoding services
    return '$lat, $lng';
  }

  // Calculate distance between two positions
  double calculateDistance(Position pos1, Position pos2) {
    return Geolocator.distanceBetween(
      pos1.latitude,
      pos1.longitude,
      pos2.latitude,
      pos2.longitude,
    );
  }

  // Calculate distance in km
  double calculateDistanceKm(Position pos1, Position pos2) {
    return calculateDistance(pos1, pos2) / 1000;
  }

  // Calculate bearing between two positions
  double calculateBearing(Position pos1, Position pos2) {
    return Geolocator.bearingBetween(
      pos1.latitude,
      pos1.longitude,
      pos2.latitude,
      pos2.longitude,
    );
  }

  // Start route tracking
  Future<void> startRouteTracking(Route route) async {
    _currentRoute = route;
    _currentStops = route.stops ?? [];
    _currentStopIndex = -1;
    _currentStop = null;
    
    if (_currentStops.isNotEmpty) {
      _currentStopIndex = 0;
      _currentStop = _currentStops[0];
    }
    
    await startTracking(
      interval: const Duration(seconds: 3),
      distanceFilter: 5,
    );
    
    notifyListeners();
  }

  // Stop route tracking
  Future<void> stopRouteTracking() async {
    await stopTracking();
    _currentRoute = null;
    _currentStops = [];
    _currentStop = null;
    _currentStopIndex = -1;
    notifyListeners();
  }

  // Move to next stop
  Future<void> moveToNextStop() async {
    if (_currentStops.isEmpty) return;
    
    _currentStopIndex++;
    
    if (_currentStopIndex < _currentStops.length) {
      _currentStop = _currentStops[_currentStopIndex];
      
      // Update stop status
      if (_currentStopIndex > 0) {
        final prevStop = _currentStops[_currentStopIndex - 1];
        // Mark previous stop as completed
        // In real app, update in database
      }
    } else {
      // Route completed
      _currentStop = null;
      _currentStopIndex = _currentStops.length;
    }
    
    // Update map camera
    if (_mapController != null && _currentStop != null) {
      await _moveCameraToStop(_currentStop!);
    }
    
    notifyListeners();
  }

  // Move to previous stop
  Future<void> moveToPreviousStop() async {
    if (_currentStopIndex <= 0) return;
    
    _currentStopIndex--;
    _currentStop = _currentStops[_currentStopIndex];
    
    // Update map camera
    if (_mapController != null && _currentStop != null) {
      await _moveCameraToStop(_currentStop!);
    }
    
    notifyListeners();
  }

  // Update map camera
  Future<void> _updateMapCamera() async {
    if (_mapController == null || _currentPosition == null) return;
    
    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          zoom: 16,
          bearing: _currentPosition!.heading,
          tilt: 45,
        ),
      ),
    );
  }

  // Move camera to stop
  Future<void> _moveCameraToStop(RouteStop stop) async {
    if (_mapController == null || stop.location == null) return;
    
    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: LatLng(
            stop.location!.latitude!,
            stop.location!.longitude!,
          ),
          zoom: 16,
        ),
      ),
    );
  }

  // Move camera to position
  Future<void> moveCameraToPosition(double lat, double lng, {double? zoom}) async {
    if (_mapController == null) return;
    
    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: LatLng(lat, lng),
          zoom: zoom ?? 16,
        ),
      ),
    );
  }

  // Move camera to current location
  Future<void> moveCameraToCurrentLocation() async {
    if (_mapController == null || _currentPosition == null) return;
    
    await _mapController!.animateCamera(
      CameraUpdate.newCameraPosition(
        CameraPosition(
          target: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          zoom: 16,
        ),
      ),
    );
  }

  // Get current location as LatLng
  LatLng? get currentLatLng {
    if (_currentPosition == null) return null;
    return LatLng(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
    );
  }

  // Get current stop location
  LatLng? get currentStopLatLng {
    if (_currentStop == null || _currentStop!.location == null) return null;
    return LatLng(
      _currentStop!.location!.latitude!,
      _currentStop!.location!.longitude!,
    );
  }

  // Calculate distance to current stop
  double? get distanceToCurrentStop {
    if (_currentPosition == null || _currentStop == null || _currentStop!.location == null) {
      return null;
    }
    
    return calculateDistance(
      _currentPosition!,
      Position(
        latitude: _currentStop!.location!.latitude!,
        longitude: _currentStop!.location!.longitude!,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
      ),
    );
  }

  // Calculate distance to current stop in km
  double? get distanceToCurrentStopKm {
    final distance = distanceToCurrentStop;
    if (distance == null) return null;
    return distance / 1000;
  }

  // Check if at current stop
  bool get isAtCurrentStop {
    final distance = distanceToCurrentStop;
    if (distance == null) return false;
    return distance <= 50; // Within 50 meters
  }

  // Get estimated time to current stop (in minutes)
  double? get estimatedTimeToCurrentStop {
    final distanceKm = distanceToCurrentStopKm;
    if (distanceKm == null || _currentPosition!.speed == null) return null;
    
    // Assuming average speed of 30 km/h if not moving
    final speed = _currentPosition!.speed! > 0 ? _currentPosition!.speed! : 30;
    final speedKmh = speed * 3.6; // Convert m/s to km/h
    
    if (speedKmh <= 0) return null;
    
    return (distanceKm / speedKmh) * 60; // Convert hours to minutes
  }

  // Get location from address (geocoding)
  Future<Location?> getLocationFromAddress(String address) async {
    // In production, use Google Maps Geocoding API
    // This is a placeholder
    try {
      // Implement geocoding API call
      // For now, return null
      return null;
    } catch (e) {
      debugPrint('Error geocoding address: $e');
      return null;
    }
  }

  // Get address from location (reverse geocoding)
  Future<String?> getAddressFromLocation(double lat, double lng) async {
    try {
      // Implement reverse geocoding
      return '$lat, $lng';
    } catch (e) {
      debugPrint('Error reverse geocoding: $e');
      return null;
    }
  }

  // Check if location is within radius
  bool isWithinRadius(
    double centerLat,
    double centerLng,
    double lat,
    double lng,
    double radiusKm,
  ) {
    final distanceKm = calculateDistance(
      Position(
        latitude: centerLat,
        longitude: centerLng,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
      ),
      Position(
        latitude: lat,
        longitude: lng,
        timestamp: DateTime.now(),
        accuracy: 0,
        altitude: 0,
        heading: 0,
        speed: 0,
        speedAccuracy: 0,
      ),
    ) / 1000;
    
    return distanceKm <= radiusKm;
  }

  // Calculate route distance
  double calculateRouteDistance(List<RouteStop> stops) {
    if (stops.isEmpty) return 0;
    
    double totalDistance = 0;
    
    for (int i = 0; i < stops.length - 1; i++) {
      final stop1 = stops[i];
      final stop2 = stops[i + 1];
      
      if (stop1.location != null && stop2.location != null) {
        final distance = calculateDistance(
          Position(
            latitude: stop1.location!.latitude!,
            longitude: stop1.location!.longitude!,
            timestamp: DateTime.now(),
            accuracy: 0,
            altitude: 0,
            heading: 0,
            speed: 0,
            speedAccuracy: 0,
          ),
          Position(
            latitude: stop2.location!.latitude!,
            longitude: stop2.location!.longitude!,
            timestamp: DateTime.now(),
            accuracy: 0,
            altitude: 0,
            heading: 0,
            speed: 0,
            speedAccuracy: 0,
          ),
        );
        totalDistance += distance;
      }
    }
    
    return totalDistance;
  }

  // Calculate route distance in km
  double calculateRouteDistanceKm(List<RouteStop> stops) {
    return calculateRouteDistance(stops) / 1000;
  }

  // Get current speed in km/h
  double? get currentSpeedKmh {
    if (_currentPosition?.speed == null) return null;
    return _currentPosition!.speed! * 3.6;
  }

  // Dispose
  @override
  void dispose() {
    stopTracking();
    _mapController = null;
    super.dispose();
  }
}
