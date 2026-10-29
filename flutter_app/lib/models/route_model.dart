import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:vendor_saathi/models/order_model.dart';
import 'package:vendor_saathi/models/customer_model.dart';

part 'route_model.freezed.dart';
part 'route_model.g.dart';

@freezed
class Route with _$Route {
  const factory Route({
    String? id,
    String? vendorId,
    String? routeNumber,
    String? name,
    String? status,
    List<RouteStop>? stops,
    List<String>? orderIds,
    List<Order>? orders,
    Location? startLocation,
    Location? endLocation,
    double? totalDistance,
    String? totalDistanceText,
    double? totalTime,
    String? totalTimeText,
    double? fuelCost,
    double? estimatedEarnings,
    int? totalDeliveries,
    int? completedDeliveries,
    DateTime? startTime,
    DateTime? endTime,
    DateTime? scheduledDate,
    String? vehicleType,
    String? vehicleNumber,
    String? driverId,
    String? driverName,
    String? driverPhone,
    bool? isOptimized,
    RouteOptimization? optimization,
    List<RouteConstraint>? constraints,
    String? notes,
    String? color,
    int? priority,
    DateTime? createdAt,
    DateTime? updatedAt,
    // For offline sync
    bool? isSynced,
    DateTime? lastSyncedAt,
    String? syncStatus,
  }) = _Route;

  factory Route.fromJson(Map<String, dynamic> json) => _$RouteFromJson(json);
  
  factory Route.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return Route.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class RouteStop with _$RouteStop {
  const factory RouteStop({
    String? id,
    int? sequence,
    String? stopType,
    String? orderId,
    Order? order,
    String? customerId,
    Customer? customer,
    Location? location,
    DateTime? arrivalTime,
    DateTime? departureTime,
    DateTime? scheduledArrival,
    DateTime? scheduledDeparture,
    double? distanceFromPrevious,
    double? timeFromPrevious,
    String? status,
    String? notes,
    List<RouteStopTask>? tasks,
    bool? isCompleted,
    DateTime? completedAt,
    String? signature,
    String? proofOfDelivery,
    double? rating,
    String? feedback,
  }) = _RouteStop;

  factory RouteStop.fromJson(Map<String, dynamic> json) => 
      _$RouteStopFromJson(json);
}

@freezed
class RouteStopTask with _$RouteStopTask {
  const factory RouteStopTask({
    String? id,
    String? type,
    String? description,
    bool? isCompleted,
    DateTime? completedAt,
    String? notes,
    String? imageProof,
  }) = _RouteStopTask;

  factory RouteStopTask.fromJson(Map<String, dynamic> json) => 
      _$RouteStopTaskFromJson(json);
}

@freezed
class RouteOptimization with _$RouteOptimization {
  const factory RouteOptimization({
    String? algorithm,
    double? optimizationScore,
    double? originalDistance,
    double? optimizedDistance,
    double? distanceSaved,
    double? originalTime,
    double? optimizedTime,
    double? timeSaved,
    List<OptimizationFactor>? factors,
    DateTime? optimizedAt,
  }) = _RouteOptimization;

  factory RouteOptimization.fromJson(Map<String, dynamic> json) => 
      _$RouteOptimizationFromJson(json);
}

@freezed
class OptimizationFactor with _$OptimizationFactor {
  const factory OptimizationFactor({
    String? name,
    String? kannadaName,
    double? weight,
    double? value,
    String? unit,
    String? description,
  }) = _OptimizationFactor;

  factory OptimizationFactor.fromJson(Map<String, dynamic> json) => 
      _$OptimizationFactorFromJson(json);
}

@freezed
class RouteConstraint with _$RouteConstraint {
  const factory RouteConstraint({
    String? id,
    String? type,
    String? description,
    double? value,
    String? unit,
    bool? isHardConstraint,
  }) = _RouteConstraint;

  factory RouteConstraint.fromJson(Map<String, dynamic> json) => 
      _$RouteConstraintFromJson(json);
}

@freezed
class RouteStatistics with _$RouteStatistics {
  const factory RouteStatistics({
    String? routeId,
    int? totalRoutes,
    int? completedRoutes,
    int? onTimeDeliveries,
    int? lateDeliveries,
    double? averageRating,
    double? averageDistance,
    double? averageTime,
    double? totalFuelCost,
    double? totalEarnings,
    double? averageEarningsPerRoute,
    Map<String, int>? deliveriesByDay,
    Map<String, int>? deliveriesByHour,
    List<RoutePerformance>? recentPerformance,
  }) = _RouteStatistics;

  factory RouteStatistics.fromJson(Map<String, dynamic> json) => 
      _$RouteStatisticsFromJson(json);
}

@freezed
class RoutePerformance with _$RoutePerformance {
  const factory RoutePerformance({
    String? routeId,
    DateTime? date,
    int? deliveries,
    double? distance,
    double? time,
    double? earnings,
    double? fuelCost,
    double? rating,
    bool? onTime,
  }) = _RoutePerformance;

  factory RoutePerformance.fromJson(Map<String, dynamic> json) => 
      _$RoutePerformanceFromJson(json);
}

@freezed
class Location with _$Location {
  const factory Location({
    double? latitude,
    double? longitude,
    String? address,
    String? city,
    String? state,
    String? pincode,
    String? country,
    String? landmark,
    DateTime? timestamp,
    double? accuracy,
    double? altitude,
    double? speed,
    double? bearing,
  }) = _Location;

  factory Location.fromJson(Map<String, dynamic> json) => 
      _$LocationFromJson(json);
}

@freezed
class WeatherInfo with _$WeatherInfo {
  const factory WeatherInfo({
    String? condition,
    String? kannadaCondition,
    String? icon,
    double? temperature,
    double? feelsLike,
    double? humidity,
    double? windSpeed,
    double? windDirection,
    double? precipitation,
    double? visibility,
    double? uvIndex,
    double? pressure,
    DateTime? sunrise,
    DateTime? sunset,
    bool? isRaining,
    bool? isHot,
    bool? isCold,
    String? recommendation,
    String? kannadaRecommendation,
  }) = _WeatherInfo;

  factory WeatherInfo.fromJson(Map<String, dynamic> json) => 
      _$WeatherInfoFromJson(json);
}

// Route Status
class RouteStatus {
  static const planned = 'Planned';
  static const started = 'Started';
  static const inProgress = 'In Progress';
  static const paused = 'Paused';
  static const completed = 'Completed';
  static const cancelled = 'Cancelled';
  
  static const List<String> statuses = [
    planned,
    started,
    inProgress,
    paused,
    completed,
    cancelled,
  ];
}

// Stop Type
class StopType {
  static const delivery = 'Delivery';
  static const pickup = 'Pickup';
  static const breakStop = 'Break';
  static const fuelStop = 'Fuel';
  static const warehouse = 'Warehouse';
  static const vendor = 'Vendor';
  
  static const List<String> types = [
    delivery,
    pickup,
    breakStop,
    fuelStop,
    warehouse,
    vendor,
  ];
}

// Stop Status
class StopStatus {
  static const pending = 'Pending';
  static const arrived = 'Arrived';
  static const inProgress = 'In Progress';
  static const completed = 'Completed';
  static const skipped = 'Skipped';
  static const failed = 'Failed';
  
  static const List<String> statuses = [
    pending,
    arrived,
    inProgress,
    completed,
    skipped,
    failed,
  ];
}

// Task Type
class TaskType {
  static const deliver = 'Deliver';
  static const collectPayment = 'Collect Payment';
  static const collectSignature = 'Collect Signature';
  static const verifyOrder = 'Verify Order';
  static const takePhoto = 'Take Photo';
  static const custom = 'Custom';
  
  static const List<String> types = [
    deliver,
    collectPayment,
    collectSignature,
    verifyOrder,
    takePhoto,
    custom,
  ];
}

// Optimization Algorithm
class OptimizationAlgorithm {
  static const nearestNeighbor = 'Nearest Neighbor';
  static const geneticAlgorithm = 'Genetic Algorithm';
  static const simulatedAnnealing = 'Simulated Annealing';
  static const antColony = 'Ant Colony';
  static const googleOrTools = 'Google OR-Tools';
  
  static const List<String> algorithms = [
    nearestNeighbor,
    geneticAlgorithm,
    simulatedAnnealing,
    antColony,
    googleOrTools,
  ];
}
