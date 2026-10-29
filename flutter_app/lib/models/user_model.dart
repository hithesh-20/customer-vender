import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_model.freezed.dart';
part 'user_model.g.dart';

@freezed
class User with _$User {
  const factory User({
    String? id,
    String? uid,
    String? email,
    String? phone,
    String? name,
    String? shopName,
    String? shopAddress,
    String? city,
    String? state,
    String? pincode,
    String? gstNumber,
    String? panNumber,
    String? profileImage,
    String? aadharNumber,
    String? businessType,
    List<String>? categories,
    double? latitude,
    double? longitude,
    String? deviceToken,
    bool? isActive,
    bool? isVerified,
    bool? isOnline,
    DateTime? lastActiveAt,
    DateTime? createdAt,
    DateTime? updatedAt,
    // Preferences
    UserPreferences? preferences,
    // Business info
    BusinessInfo? businessInfo,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  
  factory User.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return User.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class UserPreferences with _$UserPreferences {
  const factory UserPreferences({
    String? language,
    bool? notificationsEnabled,
    bool? soundEnabled,
    bool? vibrationEnabled,
    String? theme,
    String? currency,
    bool? autoSyncEnabled,
    int? syncInterval,
  }) = _UserPreferences;

  factory UserPreferences.fromJson(Map<String, dynamic> json) => 
      _$UserPreferencesFromJson(json);
}

@freezed
class BusinessInfo with _$BusinessInfo {
  const factory BusinessInfo({
    String? businessName,
    String? businessType,
    List<String>? categories,
    String? description,
    String? tagline,
    String? logo,
    List<String>? images,
    String? registrationNumber,
    DateTime? establishedDate,
    int? employeeCount,
    double? rating,
    int? reviewCount,
    List<String>? paymentMethods,
    bool? homeDelivery,
    double? deliveryRadius,
    double? deliveryCharge,
    String? minOrderAmount,
    String? openingTime,
    String? closingTime,
    List<WorkingDay>? workingDays,
    List<String>? holidays,
  }) = _BusinessInfo;

  factory BusinessInfo.fromJson(Map<String, dynamic> json) => 
      _$BusinessInfoFromJson(json);
}

@freezed
class WorkingDay with _$WorkingDay {
  const factory WorkingDay({
    String? day,
    bool? isOpen,
    String? openingTime,
    String? closingTime,
  }) = _WorkingDay;

  factory WorkingDay.fromJson(Map<String, dynamic> json) => 
      _$WorkingDayFromJson(json);
}
