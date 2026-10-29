import 'package:freezed_annotation/freezed_annotation.dart';

part 'analytics_model.freezed.dart';
part 'analytics_model.g.dart';

@freezed
class BusinessAnalytics with _$BusinessAnalytics {
  const factory BusinessAnalytics({
    String? vendorId,
    DateTime? date,
    DateTime? startDate,
    DateTime? endDate,
    // Sales Analytics
    SalesAnalytics? sales,
    // Revenue Analytics
    RevenueAnalytics? revenue,
    // Profit Analytics
    ProfitAnalytics? profit,
    // Product Analytics
    ProductAnalytics? products,
    // Customer Analytics
    CustomerAnalytics? customers,
    // Order Analytics
    OrderAnalytics? orders,
    // Payment Analytics
    PaymentAnalytics? payments,
    // Udhaar Analytics
    UdhaarAnalytics? udhaar,
    // Route Analytics
    RouteAnalytics? routes,
    // Inventory Analytics
    InventoryAnalytics? inventory,
    // Demand Forecast
    DemandForecast? demandForecast,
    // Trends
    List<TrendData>? trends,
    // Insights
    List<BusinessInsight>? insights,
    // Comparisons
    ComparisonData? comparisons,
  }) = _BusinessAnalytics;

  factory BusinessAnalytics.fromJson(Map<String, dynamic> json) => 
      _$BusinessAnalyticsFromJson(json);
}

@freezed
class SalesAnalytics with _$SalesAnalytics {
  const factory SalesAnalytics({
    int? totalOrders,
    int? completedOrders,
    int? cancelledOrders,
    double? totalQuantity,
    double? averageOrderValue,
    double? averageOrderQuantity,
    Map<String, int>? salesByDay,
    Map<String, int>? salesByHour,
    Map<String, int>? salesByCategory,
    Map<String, int>? salesByProduct,
    Map<String, int>? salesByCustomer,
    Map<String, int>? salesByLocation,
    List<SalesDataPoint>? dailySales,
    List<SalesDataPoint>? weeklySales,
    List<SalesDataPoint>? monthlySales,
    double? growthRate,
    double? conversionRate,
  }) = _SalesAnalytics;

  factory SalesAnalytics.fromJson(Map<String, dynamic> json) => 
      _$SalesAnalyticsFromJson(json);
}

@freezed
class SalesDataPoint with _$SalesDataPoint {
  const factory SalesDataPoint({
    DateTime? date,
    int? orders,
    int? quantity,
    double? revenue,
    double? profit,
    double? averageOrderValue,
  }) = _SalesDataPoint;

  factory SalesDataPoint.fromJson(Map<String, dynamic> json) => 
      _$SalesDataPointFromJson(json);
}

@freezed
class RevenueAnalytics with _$RevenueAnalytics {
  const factory RevenueAnalytics({
    double? totalRevenue,
    double? grossRevenue,
    double? netRevenue,
    double? averageRevenuePerOrder,
    double? averageRevenuePerCustomer,
    double? averageRevenuePerDay,
    Map<String, double>? revenueByDay,
    Map<String, double>? revenueByCategory,
    Map<String, double>? revenueByProduct,
    Map<String, double>? revenueByPaymentMethod,
    List<RevenueDataPoint>? dailyRevenue,
    List<RevenueDataPoint>? monthlyRevenue,
    double? growthRate,
    double? revenuePerEmployee,
  }) = _RevenueAnalytics;

  factory RevenueAnalytics.fromJson(Map<String, dynamic> json) => 
      _$RevenueAnalyticsFromJson(json);
}

@freezed
class RevenueDataPoint with _$RevenueDataPoint {
  const factory RevenueDataPoint({
    DateTime? date,
    double? revenue,
    double? gross,
    double? net,
    int? orders,
    double? averageOrderValue,
  }) = _RevenueDataPoint;

  factory RevenueDataPoint.fromJson(Map<String, dynamic> json) => 
      _$RevenueDataPointFromJson(json);
}

@freezed
class ProfitAnalytics with _$ProfitAnalytics {
  const factory ProfitAnalytics({
    double? totalProfit,
    double? grossProfit,
    double? netProfit,
    double? profitMargin,
    double? averageProfitPerOrder,
    double? averageProfitPerProduct,
    Map<String, double>? profitByCategory,
    Map<String, double>? profitByProduct,
    List<ProfitDataPoint>? dailyProfit,
    List<ProfitDataPoint>? monthlyProfit,
    ExpenseBreakdown? expenses,
    double? roi,
  }) = _ProfitAnalytics;

  factory ProfitAnalytics.fromJson(Map<String, dynamic> json) => 
      _$ProfitAnalyticsFromJson(json);
}

@freezed
class ProfitDataPoint with _$ProfitDataPoint {
  const factory ProfitDataPoint({
    DateTime? date,
    double? revenue,
    double? cost,
    double? profit,
    double? margin,
  }) = _ProfitDataPoint;

  factory ProfitDataPoint.fromJson(Map<String, dynamic> json) => 
      _$ProfitDataPointFromJson(json);
}

@freezed
class ExpenseBreakdown with _$ExpenseBreakdown {
  const factory ExpenseBreakdown({
    double? costOfGoodsSold,
    double? operationalCosts,
    double? deliveryCosts,
    double? marketingCosts,
    double? salaryCosts,
    double? rentCosts,
    double? utilityCosts,
    double? otherCosts,
    double? totalCosts,
    Map<String, double>? byCategory,
  }) = _ExpenseBreakdown;

  factory ExpenseBreakdown.fromJson(Map<String, dynamic> json) => 
      _$ExpenseBreakdownFromJson(json);
}

@freezed
class ProductAnalytics with _$ProductAnalytics {
  const factory ProductAnalytics({
    int? totalProducts,
    int? activeProducts,
    int? outOfStockProducts,
    int? lowStockProducts,
    Map<String, int>? productsByCategory,
    List<ProductPerformance>? topSelling,
    List<ProductPerformance>? leastSelling,
    List<ProductPerformance>? mostProfitable,
    List<ProductPerformance>? fastestMoving,
    List<ProductPerformance>? slowestMoving,
    Map<String, int>? stockLevels,
    double? averageStockTurnover,
  }) = _ProductAnalytics;

  factory ProductAnalytics.fromJson(Map<String, dynamic> json) => 
      _$ProductAnalyticsFromJson(json);
}

@freezed
class ProductPerformance with _$ProductPerformance {
  const factory ProductPerformance({
    String? productId,
    String? productName,
    String? category,
    int? quantitySold,
    double? revenue,
    double? profit,
    double? profitMargin,
    int? orders,
    double? rating,
    int? stock,
    double? salesVelocity,
    int? rank,
  }) = _ProductPerformance;

  factory ProductPerformance.fromJson(Map<String, dynamic> json) => 
      _$ProductPerformanceFromJson(json);
}

@freezed
class CustomerAnalytics with _$CustomerAnalytics {
  const factory CustomerAnalytics({
    int? totalCustomers,
    int? activeCustomers,
    int? newCustomers,
    int? returningCustomers,
    int? loyalCustomers,
    double? customerRetentionRate,
    double? customerAcquisitionCost,
    double? customerLifetimeValue,
    Map<String, int>? customersByTier,
    List<CustomerPerformance>? topCustomers,
    List<CustomerPerformance>? newCustomersList,
    Map<String, int>? customersByLocation,
    double? averageOrderFrequency,
    double? repeatPurchaseRate,
  }) = _CustomerAnalytics;

  factory CustomerAnalytics.fromJson(Map<String, dynamic> json) => 
      _$CustomerAnalyticsFromJson(json);
}

@freezed
class CustomerPerformance with _$CustomerPerformance {
  const factory CustomerPerformance({
    String? customerId,
    String? customerName,
    String? phone,
    String? tier,
    int? orderCount,
    double? totalSpent,
    double? averageOrderValue,
    DateTime? firstOrder,
    DateTime? lastOrder,
    double? loyaltyPoints,
    double? rating,
    int? rank,
  }) = _CustomerPerformance;

  factory CustomerPerformance.fromJson(Map<String, dynamic> json) => 
      _$CustomerPerformanceFromJson(json);
}

@freezed
class OrderAnalytics with _$OrderAnalytics {
  const factory OrderAnalytics({
    int? totalOrders,
    int? completedOrders,
    int? cancelledOrders,
    int? deliveredOrders,
    double? averageOrderValue,
    double? averageDeliveryTime,
    Map<String, int>? ordersByStatus,
    Map<String, int>? ordersByType,
    Map<String, int>? ordersByDay,
    Map<String, int>? ordersByHour,
    List<OrderDataPoint>? deliveryTimes,
    double? onTimeDeliveryRate,
    double? cancellationRate,
  }) = _OrderAnalytics;

  factory OrderAnalytics.fromJson(Map<String, dynamic> json) => 
      _$OrderAnalyticsFromJson(json);
}

@freezed
class OrderDataPoint with _$OrderDataPoint {
  const factory OrderDataPoint({
    DateTime? date,
    int? orders,
    int? completed,
    int? cancelled,
    double? averageDeliveryTime,
    double? onTimeRate,
  }) = _OrderDataPoint;

  factory OrderDataPoint.fromJson(Map<String, dynamic> json) => 
      _$OrderDataPointFromJson(json);
}

@freezed
class PaymentAnalytics with _$PaymentAnalytics {
  const factory PaymentAnalytics({
    int? totalPayments,
    double? totalAmount,
    double? averagePaymentValue,
    Map<String, double>? paymentsByMethod,
    Map<String, int>? paymentsByStatus,
    Map<String, double>? paymentsByDay,
    double? udhaarAmount,
    double? udhaarCollected,
    double? udhaarPending,
    double? collectionRate,
    List<PaymentMethodStats>? methodStats,
  }) = _PaymentAnalytics;

  factory PaymentAnalytics.fromJson(Map<String, dynamic> json) => 
      _$PaymentAnalyticsFromJson(json);
}

@freezed
class PaymentMethodStats with _$PaymentMethodStats {
  const factory PaymentMethodStats({
    String? method,
    int? count,
    double? amount,
    double? percentage,
    double? averageAmount,
  }) = _PaymentMethodStats;

  factory PaymentMethodStats.fromJson(Map<String, dynamic> json) => 
      _$PaymentMethodStatsFromJson(json);
}

@freezed
class UdhaarAnalytics with _$UdhaarAnalytics {
  const factory UdhaarAnalytics({
    int? totalUdhaars,
    int? activeUdhaars,
    int? paidUdhaars,
    int? overdueUdhaars,
    double? totalUdhaarAmount,
    double? totalCollected,
    double? totalPending,
    double? totalOverdue,
    double? collectionRate,
    double? overdueRate,
    Map<String, double>? udhaarByCustomer,
    List<UdhaarDataPoint>? udhaarTrends,
    double? averageUdhaarAmount,
    double? averageRepaymentTime,
  }) = _UdhaarAnalytics;

  factory UdhaarAnalytics.fromJson(Map<String, dynamic> json) => 
      _$UdhaarAnalyticsFromJson(json);
}

@freezed
class UdhaarDataPoint with _$UdhaarDataPoint {
  const factory UdhaarDataPoint({
    DateTime? date,
    int? newUdhaars,
    int? paidUdhaars,
    double? amountGiven,
    double? amountCollected,
    double? outstanding,
  }) = _UdhaarDataPoint;

  factory UdhaarDataPoint.fromJson(Map<String, dynamic> json) => 
      _$UdhaarDataPointFromJson(json);
}

@freezed
class RouteAnalytics with _$RouteAnalytics {
  const factory RouteAnalytics({
    int? totalRoutes,
    int? completedRoutes,
    double? totalDistance,
    double? totalTime,
    double? averageDistance,
    double? averageTime,
    double? fuelCost,
    double? deliveryCost,
    double? averageDeliveriesPerRoute,
    Map<String, double>? distanceByRoute,
    Map<String, double>? timeByRoute,
    double? routeEfficiency,
    double? onTimeRate,
    List<RouteDataPoint>? routePerformance,
  }) = _RouteAnalytics;

  factory RouteAnalytics.fromJson(Map<String, dynamic> json) => 
      _$RouteAnalyticsFromJson(json);
}

@freezed
class RouteDataPoint with _$RouteDataPoint {
  const factory RouteDataPoint({
    String? routeId,
    String? routeName,
    DateTime? date,
    double? distance,
    double? time,
    int? deliveries,
    double? fuelCost,
    double? earnings,
    bool? onTime,
    double? efficiencyScore,
  }) = _RouteDataPoint;

  factory RouteDataPoint.fromJson(Map<String, dynamic> json) => 
      _$RouteDataPointFromJson(json);
}

@freezed
class InventoryAnalytics with _$InventoryAnalytics {
  const factory InventoryAnalytics({
    int? totalProducts,
    int? inStockProducts,
    int? outOfStockProducts,
    int? lowStockProducts,
    double? totalInventoryValue,
    double? averageStockLevel,
    double? stockTurnoverRate,
    Map<String, int>? stockByCategory,
    List<InventoryAlert>? alerts,
    List<StockMovement>? stockMovements,
    Map<String, double>? wastageByCategory,
    double? wastageRate,
  }) = _InventoryAnalytics;

  factory InventoryAnalytics.fromJson(Map<String, dynamic> json) => 
      _$InventoryAnalyticsFromJson(json);
}

@freezed
class InventoryAlert with _$InventoryAlert {
  const factory InventoryAlert({
    String? productId,
    String? productName,
    String? type,
    String? message,
    int? currentStock,
    int? threshold,
    DateTime? createdAt,
    bool? isResolved,
    DateTime? resolvedAt,
  }) = _InventoryAlert;

  factory InventoryAlert.fromJson(Map<String, dynamic> json) => 
      _$InventoryAlertFromJson(json);
}

@freezed
class StockMovement with _$StockMovement {
  const factory StockMovement({
    String? productId,
    String? productName,
    DateTime? date,
    String? type,
    int? quantity,
    double? value,
    int? remainingStock,
  }) = _StockMovement;

  factory StockMovement.fromJson(Map<String, dynamic> json) => 
      _$StockMovementFromJson(json);
}

@freezed
class DemandForecast with _$DemandForecast {
  const factory DemandForecast({
    String? vendorId,
    DateTime? forecastDate,
    DateTime? startDate,
    DateTime? endDate,
    List<DemandPrediction>? predictions,
    Map<String, double>? demandByCategory,
    Map<String, double>? demandByProduct,
    Map<String, double>? demandByLocation,
    List<DemandTrend>? trends,
    double? confidenceScore,
    String? modelVersion,
    DateTime? generatedAt,
  }) = _DemandForecast;

  factory DemandForecast.fromJson(Map<String, dynamic> json) => 
      _$DemandForecastFromJson(json);
}

@freezed
class DemandPrediction with _$DemandPrediction {
  const factory DemandPrediction({
    String? productId,
    String? productName,
    String? category,
    DateTime? date,
    double? predictedQuantity,
    double? confidence,
    double? lowerBound,
    double? upperBound,
    double? actualQuantity,
    double? error,
  }) = _DemandPrediction;

  factory DemandPrediction.fromJson(Map<String, dynamic> json) => 
      _$DemandPredictionFromJson(json);
}

@freezed
class DemandTrend with _$DemandTrend {
  const factory DemandTrend({
    String? productId,
    String? productName,
    String? category,
    List<TrendPoint>? historical,
    List<TrendPoint>? forecasted,
    String? seasonality,
    double? growthRate,
  }) = _DemandTrend;

  factory DemandTrend.fromJson(Map<String, dynamic> json) => 
      _$DemandTrendFromJson(json);
}

@freezed
class TrendPoint with _$TrendPoint {
  const factory TrendPoint({
    DateTime? date,
    double? value,
    bool? isActual,
    bool? isForecast,
  }) = _TrendPoint;

  factory TrendPoint.fromJson(Map<String, dynamic> json) => 
      _$TrendPointFromJson(json);
}

@freezed
class TrendData with _$TrendData {
  const factory TrendData({
    String? name,
    String? type,
    List<TrendPoint>? data,
    String? unit,
    String? color,
  }) = _TrendData;

  factory TrendData.fromJson(Map<String, dynamic> json) => 
      _$TrendDataFromJson(json);
}

@freezed
class BusinessInsight with _$BusinessInsight {
  const factory BusinessInsight({
    String? id,
    String? type,
    String? title,
    String? kannadaTitle,
    String? description,
    String? kannadaDescription,
    double? value,
    String? unit,
    double? change,
    String? changeType,
    String? icon,
    String? color,
    DateTime? date,
    Map<String, dynamic>? data,
  }) = _BusinessInsight;

  factory BusinessInsight.fromJson(Map<String, dynamic> json) => 
      _$BusinessInsightFromJson(json);
}

@freezed
class ComparisonData with _$ComparisonData {
  const factory ComparisonData({
    ComparisonPeriod? current,
    ComparisonPeriod? previous,
    Map<String, double>? metrics,
    Map<String, double>? changes,
  }) = _ComparisonData;

  factory ComparisonData.fromJson(Map<String, dynamic> json) => 
      _$ComparisonDataFromJson(json);
}

@freezed
class ComparisonPeriod with _$ComparisonPeriod {
  const factory ComparisonPeriod({
    DateTime? startDate,
    DateTime? endDate,
    String? label,
    Map<String, dynamic>? data,
  }) = _ComparisonPeriod;

  factory ComparisonPeriod.fromJson(Map<String, dynamic> json) => 
      _$ComparisonPeriodFromJson(json);
}
