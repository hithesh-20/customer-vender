import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment_model.freezed.dart';
part 'payment_model.g.dart';

@freezed
class Payment with _$Payment {
  const factory Payment({
    String? id,
    String? paymentNumber,
    String? orderId,
    String? customerId,
    String? vendorId,
    double? amount,
    String? currency,
    String? paymentMethod,
    String? paymentGateway,
    String? transactionId,
    String? referenceId,
    String? status,
    DateTime? paymentDate,
    DateTime? processedAt,
    // UPI Details
    UpiDetails? upiDetails,
    // Bank Details
    BankDetails? bankDetails,
    // Card Details
    CardDetails? cardDetails,
    // Wallet Details
    WalletDetails? walletDetails,
    // Cash Details
    CashDetails? cashDetails,
    // Udhaar Details
    String? udhaarId,
    // Hybrid Payment
    List<PaymentSplit>? splits,
    // Fees
    double? gatewayFee,
    double? tax,
    double? totalDebited,
    // Refund
    RefundDetails? refund,
    // Notes
    String? notes,
    String? description,
    // Metadata
    Map<String, dynamic>? metadata,
    DateTime? createdAt,
    DateTime? updatedAt,
    // For offline sync
    bool? isSynced,
    DateTime? lastSyncedAt,
    String? syncStatus,
  }) = _Payment;

  factory Payment.fromJson(Map<String, dynamic> json) => _$PaymentFromJson(json);
  
  factory Payment.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return Payment.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class PaymentSplit with _$PaymentSplit {
  const factory PaymentSplit({
    String? id,
    String? paymentMethod,
    double? amount,
    String? transactionId,
    String? status,
    DateTime? processedAt,
  }) = _PaymentSplit;

  factory PaymentSplit.fromJson(Map<String, dynamic> json) => 
      _$PaymentSplitFromJson(json);
}

@freezed
class UpiDetails with _$UpiDetails {
  const factory UpiDetails({
    String? upiId,
    String? upiName,
    String? upiTransactionId,
    String? upiReferenceId,
    String? bankName,
    String? bankAccount,
    String? ifscCode,
    String? mobileNumber,
  }) = _UpiDetails;

  factory UpiDetails.fromJson(Map<String, dynamic> json) => 
      _$UpiDetailsFromJson(json);
}

@freezed
class BankDetails with _$BankDetails {
  const factory BankDetails({
    String? bankName,
    String? accountNumber,
    String? ifscCode,
    String? accountHolder,
    String? branch,
    String? chequeNumber,
    DateTime? chequeDate,
    String? chequeImage,
    String? transactionId,
    String? referenceNumber,
  }) = _BankDetails;

  factory BankDetails.fromJson(Map<String, dynamic> json) => 
      _$BankDetailsFromJson(json);
}

@freezed
class CardDetails with _$CardDetails {
  const factory CardDetails({
    String? cardType,
    String? cardNumber,
    String? cardHolder,
    String? expiryMonth,
    String? expiryYear,
    String? cvv,
    String? bankName,
    String? bankCode,
    String? transactionId,
    String? authCode,
    bool? isSaved,
    String? savedCardId,
  }) = _CardDetails;

  factory CardDetails.fromJson(Map<String, dynamic> json) => 
      _$CardDetailsFromJson(json);
}

@freezed
class WalletDetails with _$WalletDetails {
  const factory WalletDetails({
    String? walletName,
    String? walletId,
    String? phone,
    String? email,
    String? transactionId,
    double? balance,
    double? cashback,
  }) = _WalletDetails;

  factory WalletDetails.fromJson(Map<String, dynamic> json) => 
      _$WalletDetailsFromJson(json);
}

@freezed
class CashDetails with _$CashDetails {
  const factory CashDetails({
    double? receivedAmount,
    double? changeGiven,
    String? receivedBy,
    String? notes,
  }) = _CashDetails;

  factory CashDetails.fromJson(Map<String, dynamic> json) => 
      _$CashDetailsFromJson(json);
}

@freezed
class RefundDetails with _$RefundDetails {
  const factory RefundDetails({
    String? id,
    double? amount,
    String? reason,
    String? status,
    String? refundMethod,
    String? transactionId,
    DateTime? requestedAt,
    DateTime? processedAt,
    String? processedBy,
    String? notes,
  }) = _RefundDetails;

  factory RefundDetails.fromJson(Map<String, dynamic> json) => 
      _$RefundDetailsFromJson(json);
}

@freezed
class PaymentSummary with _$PaymentSummary {
  const factory PaymentSummary({
    String? vendorId,
    DateTime? date,
    DateTime? startDate,
    DateTime? endDate,
    int? totalPayments,
    double? totalAmount,
    double? totalFees,
    double? netAmount,
    Map<String, double>? byMethod,
    Map<String, int>? byStatus,
    Map<String, double>? byDay,
    List<Payment>? recentPayments,
  }) = _PaymentSummary;

  factory PaymentSummary.fromJson(Map<String, dynamic> json) => 
      _$PaymentSummaryFromJson(json);
}

@freezed
class PaymentMethodStats with _$PaymentMethodStats {
  const factory PaymentMethodStats({
    String? method,
    String? displayName,
    int? count,
    double? amount,
    double? percentage,
    String? icon,
    String? color,
  }) = _PaymentMethodStats;

  factory PaymentMethodStats.fromJson(Map<String, dynamic> json) => 
      _$PaymentMethodStatsFromJson(json);
}

// Payment Status
class PaymentStatus {
  static const pending = 'Pending';
  static const initiated = 'Initiated';
  static const processing = 'Processing';
  static const completed = 'Completed';
  static const failed = 'Failed';
  static const cancelled = 'Cancelled';
  static const refunded = 'Refunded';
  static const partialRefund = 'Partial Refund';
  
  static const List<String> statuses = [
    pending,
    initiated,
    processing,
    completed,
    failed,
    cancelled,
    refunded,
    partialRefund,
  ];
}

// Payment Gateway
class PaymentGateway {
  static const razorpay = 'Razorpay';
  static const paytm = 'Paytm';
  static const phonepe = 'PhonePe';
  static const googlePay = 'Google Pay';
  static const paypal = 'PayPal';
  static const stripe = 'Stripe';
  static const manual = 'Manual';
  static const upi = 'UPI';
  static const bankTransfer = 'Bank Transfer';
  static const cash = 'Cash';
  static const wallet = 'Wallet';
  
  static const List<String> gateways = [
    razorpay,
    paytm,
    phonepe,
    googlePay,
    paypal,
    stripe,
    manual,
    upi,
    bankTransfer,
    cash,
    wallet,
  ];
}

// Card Type
class CardType {
  static const visa = 'Visa';
  static const mastercard = 'Mastercard';
  static const rupay = 'Rupay';
  static const amex = 'American Express';
  static const discover = 'Discover';
  static const maestro = 'Maestro';
  
  static const List<String> types = [
    visa,
    mastercard,
    rupay,
    amex,
    discover,
    maestro,
  ];
}

// Refund Status
class RefundStatus {
  static const requested = 'Requested';
  static const approved = 'Approved';
  static const processing = 'Processing';
  static const completed = 'Completed';
  static const rejected = 'Rejected';
  static const failed = 'Failed';
  
  static const List<String> statuses = [
    requested,
    approved,
    processing,
    completed,
    rejected,
    failed,
  ];
}
