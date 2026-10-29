import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:vendor_saathi/models/product_model.dart';
import 'package:vendor_saathi/models/customer_model.dart';

part 'order_model.freezed.dart';
part 'order_model.g.dart';

@freezed
class Order with _$Order {
  const factory Order({
    String? id,
    String? orderNumber,
    String? vendorId,
    String? customerId,
    Customer? customer,
    String? status,
    String? type,
    List<OrderItem>? items,
    double? subtotal,
    double? discount,
    double? tax,
    double? taxRate,
    double? deliveryCharge,
    double? total,
    double? paidAmount,
    double? dueAmount,
    String? paymentMethod,
    String? paymentStatus,
    PaymentDetails? paymentDetails,
    String? deliveryType,
    DeliveryAddress? deliveryAddress,
    DateTime? orderDate,
    DateTime? deliveryDate,
    DateTime? expectedDeliveryDate,
    String? notes,
    String? specialInstructions,
    String? couponCode,
    double? couponDiscount,
    bool? isUdhaar,
    UdhaarDetails? udhaarDetails,
    List<OrderStatusHistory>? statusHistory,
    String? assignedTo,
    String? deliveryBoyId,
    DeliveryBoy? deliveryBoy,
    Location? vendorLocation,
    Location? deliveryLocation,
    String? routeId,
    double? distance,
    String? estimatedTime,
    DateTime? acceptedAt,
    DateTime? preparedAt,
    DateTime? dispatchedAt,
    DateTime? deliveredAt,
    DateTime? cancelledAt,
    String? cancellationReason,
    double? rating,
    String? review,
    DateTime? createdAt,
    DateTime? updatedAt,
    // For offline sync
    bool? isSynced,
    DateTime? lastSyncedAt,
    String? syncStatus,
  }) = _Order;

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
  
  factory Order.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return Order.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class OrderItem with _$OrderItem {
  const factory OrderItem({
    String? id,
    String? productId,
    Product? product,
    String? name,
    String? kannadaName,
    String? image,
    int? quantity,
    double? unitPrice,
    double? totalPrice,
    double? discount,
    String? unit,
    Map<String, dynamic>? attributes,
    String? notes,
    bool? isReturned,
    int? returnedQuantity,
    String? returnReason,
  }) = _OrderItem;

  factory OrderItem.fromJson(Map<String, dynamic> json) => 
      _$OrderItemFromJson(json);
}

@freezed
class PaymentDetails with _$PaymentDetails {
  const factory PaymentDetails({
    String? transactionId,
    String? paymentGateway,
    String? paymentMethod,
    String? status,
    double? amount,
    String? currency,
    DateTime? paidAt,
    String? upiTransactionId,
    String? upiReferenceId,
    String? bankName,
    String? accountNumber,
    String? ifscCode,
    String? chequeNumber,
    DateTime? chequeDate,
    String? paymentNotes,
  }) = _PaymentDetails;

  factory PaymentDetails.fromJson(Map<String, dynamic> json) => 
      _$PaymentDetailsFromJson(json);
}

@freezed
class UdhaarDetails with _$UdhaarDetails {
  const factory UdhaarDetails({
    String? id,
    double? amount,
    double? paid,
    double? remaining,
    DateTime? dueDate,
    DateTime? createdAt,
    List<UdhaarPayment>? payments,
    String? status,
    String? notes,
  }) = _UdhaarDetails;

  factory UdhaarDetails.fromJson(Map<String, dynamic> json) => 
      _$UdhaarDetailsFromJson(json);
}

@freezed
class UdhaarPayment with _$UdhaarPayment {
  const factory UdhaarPayment({
    String? id,
    double? amount,
    DateTime? paidAt,
    String? paymentMethod,
    String? transactionId,
    String? notes,
  }) = _UdhaarPayment;

  factory UdhaarPayment.fromJson(Map<String, dynamic> json) => 
      _$UdhaarPaymentFromJson(json);
}

@freezed
class DeliveryAddress with _$DeliveryAddress {
  const factory DeliveryAddress({
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
  }) = _DeliveryAddress;

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) => 
      _$DeliveryAddressFromJson(json);
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
    DateTime? timestamp,
    double? accuracy,
  }) = _Location;

  factory Location.fromJson(Map<String, dynamic> json) => 
      _$LocationFromJson(json);
}

@freezed
class DeliveryBoy with _$DeliveryBoy {
  const factory DeliveryBoy({
    String? id,
    String? name,
    String? phone,
    String? vehicleNumber,
    String? vehicleType,
    bool? isActive,
    Location? currentLocation,
    double? rating,
    int? completedDeliveries,
    String? status,
  }) = _DeliveryBoy;

  factory DeliveryBoy.fromJson(Map<String, dynamic> json) => 
      _$DeliveryBoyFromJson(json);
}

@freezed
class OrderStatusHistory with _$OrderStatusHistory {
  const factory OrderStatusHistory({
    String? id,
    String? status,
    String? changedBy,
    String? changedByRole,
    String? notes,
    DateTime? changedAt,
  }) = _OrderStatusHistory;

  factory OrderStatusHistory.fromJson(Map<String, dynamic> json) => 
      _$OrderStatusHistoryFromJson(json);
}

// Order Status enum
class OrderStatus {
  static const pending = 'Pending';
  static const confirmed = 'Confirmed';
  static const accepted = 'Accepted';
  static const prepared = 'Prepared';
  static const readyForPickup = 'Ready for Pickup';
  static const dispatched = 'Dispatched';
  static const onTheWay = 'On the Way';
  static const delivered = 'Delivered';
  static const cancelled = 'Cancelled';
  static const returned = 'Returned';
  static const refunded = 'Refunded';
  static const failed = 'Failed';
  
  static const List<String> statuses = [
    pending,
    confirmed,
    accepted,
    prepared,
    readyForPickup,
    dispatched,
    onTheWay,
    delivered,
    cancelled,
    returned,
    refunded,
    failed,
  ];
}

// Order Type enum
class OrderType {
  static const delivery = 'Delivery';
  static const pickup = 'Pickup';
  static const dineIn = 'Dine In';
  static const subscription = 'Subscription';
  
  static const List<String> types = [
    delivery,
    pickup,
    dineIn,
    subscription,
  ];
}

// Payment Status enum
class PaymentStatus {
  static const pending = 'Pending';
  static const paid = 'Paid';
  static const partial = 'Partial';
  static const failed = 'Failed';
  static const refunded = 'Refunded';
  static const cancelled = 'Cancelled';
  
  static const List<String> statuses = [
    pending,
    paid,
    partial,
    failed,
    refunded,
    cancelled,
  ];
}

// Delivery Type enum
class DeliveryType {
  static const standard = 'Standard';
  static const express = 'Express';
  static const sameDay = 'Same Day';
  static const scheduled = 'Scheduled';
  
  static const List<String> types = [
    standard,
    express,
    sameDay,
    scheduled,
  ];
}

// Payment Methods
class PaymentMethod {
  static const cash = 'Cash';
  static const upi = 'UPI';
  static const bankTransfer = 'Bank Transfer';
  static const cheque = 'Cheque';
  static const card = 'Card';
  static const wallet = 'Wallet';
  static const udhaar = 'Udhaar';
  static const hybrid = 'Hybrid';
  
  static const List<String> methods = [
    cash,
    upi,
    bankTransfer,
    cheque,
    card,
    wallet,
    udhaar,
    hybrid,
  ];
}
