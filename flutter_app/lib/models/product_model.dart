import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'product_model.freezed.dart';
part 'product_model.g.dart';

@freezed
class Product with _$Product {
  const factory Product({
    String? id,
    String? vendorId,
    String? name,
    String? kannadaName,
    String? description,
    String? kannadaDescription,
    String? category,
    List<String>? subCategories,
    String? brand,
    String? unit,
    double? price,
    double? mrp,
    double? costPrice,
    int? stock,
    int? minStock,
    int? maxStock,
    bool? inStock,
    bool? isActive,
    bool? isFeatured,
    bool? isNew,
    double? discount,
    String? discountType,
    DateTime? discountStart,
    DateTime? discountEnd,
    double? rating,
    int? reviewCount,
    List<String>? images,
    String? thumbnail,
    List<String>? tags,
    // Inventory tracking
    InventoryInfo? inventoryInfo,
    // Sales data
    SalesData? salesData,
    // Attributes
    Map<String, dynamic>? attributes,
    DateTime? createdAt,
    DateTime? updatedAt,
    // For offline sync
    bool? isSynced,
    DateTime? lastSyncedAt,
    String? syncStatus,
  }) = _Product;

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  
  factory Product.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return Product.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class InventoryInfo with _$InventoryInfo {
  const factory InventoryInfo({
    int? totalStock,
    int? reservedStock,
    int? availableStock,
    int? lowStockThreshold,
    DateTime? lastRestocked,
    String? supplierId,
    String? supplierName,
    double? supplierPrice,
    String? barcode,
    String? sku,
    String? hsnCode,
    int? reorderLevel,
    int? maxStockLevel,
    List<StockHistory>? stockHistory,
  }) = _InventoryInfo;

  factory InventoryInfo.fromJson(Map<String, dynamic> json) => 
      _$InventoryInfoFromJson(json);
}

@freezed
class StockHistory with _$StockHistory {
  const factory StockHistory({
    String? id,
    String? type,
    int? quantity,
    double? unitPrice,
    double? totalValue,
    String? referenceId,
    String? referenceType,
    String? notes,
    String? createdBy,
    DateTime? createdAt,
  }) = _StockHistory;

  factory StockHistory.fromJson(Map<String, dynamic> json) => 
      _$StockHistoryFromJson(json);
}

@freezed
class SalesData with _$SalesData {
  const factory SalesData({
    int? totalSold,
    double? totalRevenue,
    double? totalProfit,
    int? views,
    int? wishlists,
    int? cartAdds,
    List<SalesTrend>? dailySales,
    List<SalesTrend>? weeklySales,
    List<SalesTrend>? monthlySales,
    Map<String, int>? categorySales,
    Map<String, int>? locationSales,
  }) = _SalesData;

  factory SalesData.fromJson(Map<String, dynamic> json) => 
      _$SalesDataFromJson(json);
}

@freezed
class SalesTrend with _$SalesTrend {
  const factory SalesTrend({
    DateTime? date,
    int? quantity,
    double? revenue,
    double? profit,
  }) = _SalesTrend;

  factory SalesTrend.fromJson(Map<String, dynamic> json) => 
      _$SalesTrendFromJson(json);
}

// Product Category enum
class ProductCategory {
  static const groceries = 'Groceries';
  static const vegetables = 'Vegetables';
  static const fruits = 'Fruits';
  static const dairy = 'Dairy';
  static const bakery = 'Bakery';
  static const snacks = 'Snacks';
  static const beverages = 'Beverages';
  static const household = 'Household';
  static const personalCare = 'Personal Care';
  static const electronics = 'Electronics';
  static const clothing = 'Clothing';
  static const footwear = 'Footwear';
  static const others = 'Others';
  
  static const List<String> categories = [
    groceries,
    vegetables,
    fruits,
    dairy,
    bakery,
    snacks,
    beverages,
    household,
    personalCare,
    electronics,
    clothing,
    footwear,
    others,
  ];
}

// Unit types
class ProductUnit {
  static const piece = 'Piece';
  static const kg = 'kg';
  static const gram = 'gram';
  static const liter = 'Liter';
  static const ml = 'ml';
  static const dozen = 'Dozen';
  static const box = 'Box';
  static const packet = 'Packet';
  static const bottle = 'Bottle';
  static const can = 'Can';
  static const meter = 'Meter';
  static const cm = 'cm';
  
  static const List<String> units = [
    piece,
    kg,
    gram,
    liter,
    ml,
    dozen,
    box,
    packet,
    bottle,
    can,
    meter,
    cm,
  ];
}
