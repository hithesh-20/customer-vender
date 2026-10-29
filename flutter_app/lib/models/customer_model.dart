import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:vendor_saathi/models/order_model.dart';

part 'customer_model.freezed.dart';
part 'customer_model.g.dart';

@freezed
class Customer with _$Customer {
  const factory Customer({
    String? id,
    String? uid,
    String? phone,
    String? email,
    String? name,
    String? profileImage,
    String? dateOfBirth,
    String? gender,
    String? anniversary,
    List<CustomerAddress>? addresses,
    CustomerAddress? defaultAddress,
    String? preferredLanguage,
    String? notes,
    List<String>? tags,
    double? totalSpent,
    int? orderCount,
    double? averageOrderValue,
    DateTime? firstOrderDate,
    DateTime? lastOrderDate,
    LoyaltyPoints? loyaltyPoints,
    String? loyaltyTier,
    List<String>? favoriteProducts,
    List<String>? favoriteCategories,
    bool? isActive,
    bool? isVerified,
    bool? isBlocked,
    String? referralCode,
    String? referredBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    // Location data
    double? latitude,
    double? longitude,
    String? currentLocation,
    // For offline sync
    bool? isSynced,
    DateTime? lastSyncedAt,
    String? syncStatus,
  }) = _Customer;

  factory Customer.fromJson(Map<String, dynamic> json) => _$CustomerFromJson(json);
  
  factory Customer.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return Customer.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class CustomerAddress with _$CustomerAddress {
  const factory CustomerAddress({
    String? id,
    String? customerId,
    String? name,
    String? phone,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? pincode,
    String? landmark,
    double? latitude,
    double? longitude,
    String? addressType,
    bool? isDefault,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _CustomerAddress;

  factory CustomerAddress.fromJson(Map<String, dynamic> json) => 
      _$CustomerAddressFromJson(json);
}

@freezed
class LoyaltyPoints with _$LoyaltyPoints {
  const factory LoyaltyPoints({
    int? totalPoints,
    int? availablePoints,
    int? redeemedPoints,
    int? expiredPoints,
    List<LoyaltyTransaction>? transactions,
    LoyaltyTier? currentTier,
    DateTime? lastUpdated,
  }) = _LoyaltyPoints;

  factory LoyaltyPoints.fromJson(Map<String, dynamic> json) => 
      _$LoyaltyPointsFromJson(json);
}

@freezed
class LoyaltyTransaction with _$LoyaltyTransaction {
  const factory LoyaltyTransaction({
    String? id,
    String? customerId,
    String? type,
    int? points,
    String? description,
    String? orderId,
    String? rewardId,
    DateTime? transactionDate,
    DateTime? expiryDate,
    String? status,
    Map<String, dynamic>? metadata,
  }) = _LoyaltyTransaction;

  factory LoyaltyTransaction.fromJson(Map<String, dynamic> json) => 
      _$LoyaltyTransactionFromJson(json);
}

@freezed
class LoyaltyTier with _$LoyaltyTier {
  const factory LoyaltyTier({
    String? id,
    String? name,
    String? kannadaName,
    int? minPoints,
    int? maxPoints,
    double? discountPercentage,
    double? cashbackPercentage,
    List<String>? benefits,
    String? color,
    String? icon,
    int? level,
  }) = _LoyaltyTier;

  factory LoyaltyTier.fromJson(Map<String, dynamic> json) => 
      _$LoyaltyTierFromJson(json);
}

@freezed
class CustomerSegment with _$CustomerSegment {
  const factory CustomerSegment({
    String? id,
    String? name,
    String? description,
    List<String>? criteria,
    int? customerCount,
    double? averageOrderValue,
    double? totalRevenue,
    DateTime? createdAt,
  }) = _CustomerSegment;

  factory CustomerSegment.fromJson(Map<String, dynamic> json) => 
      _$CustomerSegmentFromJson(json);
}

// Loyalty Tier constants
class LoyaltyTiers {
  static const bronze = LoyaltyTier(
    id: 'bronze',
    name: 'Bronze',
    kannadaName: 'ಕಂಚು',
    minPoints: 0,
    maxPoints: 999,
    discountPercentage: 0,
    cashbackPercentage: 1,
    benefits: ['Basic rewards', 'Email notifications'],
    color: '#CD7F32',
    icon: '🥉',
    level: 1,
  );
  
  static const silver = LoyaltyTier(
    id: 'silver',
    name: 'Silver',
    kannadaName: 'ಬೆಳ್ಳಿ',
    minPoints: 1000,
    maxPoints: 4999,
    discountPercentage: 5,
    cashbackPercentage: 2,
    benefits: ['Priority support', '5% discount', 'SMS notifications'],
    color: '#C0C0C0',
    icon: '🥈',
    level: 2,
  );
  
  static const gold = LoyaltyTier(
    id: 'gold',
    name: 'Gold',
    kannadaName: 'ಚಿನ್ನ',
    minPoints: 5000,
    maxPoints: 9999,
    discountPercentage: 10,
    cashbackPercentage: 3,
    benefits: ['Free delivery', '10% discount', 'Early access to sales'],
    color: '#FFD700',
    icon: '🥇',
    level: 3,
  );
  
  static const platinum = LoyaltyTier(
    id: 'platinum',
    name: 'Platinum',
    kannadaName: 'ಪ್ಲಾಟಿನಂ',
    minPoints: 10000,
    maxPoints: 999999,
    discountPercentage: 15,
    cashbackPercentage: 5,
    benefits: ['Premium support', '15% discount', 'Exclusive offers', 'Gift vouchers'],
    color: '#E5E4E2',
    icon: '🏆',
    level: 4,
  );
  
  static const List<LoyaltyTier> allTiers = [
    bronze,
    silver,
    gold,
    platinum,
  ];
}

// Customer Type
class CustomerType {
  static const regular = 'Regular';
  static const premium = 'Premium';
  static const wholesale = 'Wholesale';
  static const corporate = 'Corporate';
  static const walkIn = 'Walk-in';
  
  static const List<String> types = [
    regular,
    premium,
    wholesale,
    corporate,
    walkIn,
  ];
}

// Address Type
class AddressType {
  static const home = 'Home';
  static const work = 'Work';
  static const other = 'Other';
  
  static const List<String> types = [
    home,
    work,
    other,
  ];
}
