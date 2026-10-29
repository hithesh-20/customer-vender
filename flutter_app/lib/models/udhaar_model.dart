import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:vendor_saathi/models/customer_model.dart';
import 'package:vendor_saathi/models/order_model.dart';

part 'udhaar_model.freezed.dart';
part 'udhaar_model.g.dart';

@freezed
class Udhaar with _$Udhaar {
  const factory Udhaar({
    String? id,
    String? udhaarNumber,
    String? vendorId,
    String? customerId,
    Customer? customer,
    String? status,
    double? totalAmount,
    double? paidAmount,
    double? remainingAmount,
    double? interestRate,
    double? interestAmount,
    double? totalDue,
    DateTime? startDate,
    DateTime? dueDate,
    DateTime? paidDate,
    String? purpose,
    String? orderId,
    Order? order,
    List<UdhaarPayment>? payments,
    List<UdhaarReminder>? reminders,
    String? notes,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    // For offline sync
    bool? isSynced,
    DateTime? lastSyncedAt,
    String? syncStatus,
  }) = _Udhaar;

  factory Udhaar.fromJson(Map<String, dynamic> json) => _$UdhaarFromJson(json);
  
  factory Udhaar.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    return Udhaar.fromJson({...data, 'id': doc.id});
  }
}

@freezed
class UdhaarPayment with _$UdhaarPayment {
  const factory UdhaarPayment({
    String? id,
    String? udhaarId,
    double? amount,
    String? paymentMethod,
    String? transactionId,
    String? status,
    DateTime? paymentDate,
    String? receivedBy,
    String? notes,
    String? proofImage,
    DateTime? createdAt,
  }) = _UdhaarPayment;

  factory UdhaarPayment.fromJson(Map<String, dynamic> json) => 
      _$UdhaarPaymentFromJson(json);
}

@freezed
class UdhaarReminder with _$UdhaarReminder {
  const factory UdhaarReminder({
    String? id,
    String? udhaarId,
    String? type,
    String? message,
    String? kannadaMessage,
    DateTime? scheduledAt,
    DateTime? sentAt,
    String? sentBy,
    String? sentVia,
    String? status,
    String? response,
    DateTime? createdAt,
  }) = _UdhaarReminder;

  factory UdhaarReminder.fromJson(Map<String, dynamic> json) => 
      _$UdhaarReminderFromJson(json);
}

@freezed
class UdhaarSummary with _$UdhaarSummary {
  const factory UdhaarSummary({
    String? vendorId,
    DateTime? date,
    DateTime? startDate,
    DateTime? endDate,
    int? totalUdhaars,
    int? activeUdhaars,
    int? paidUdhaars,
    int? overdueUdhaars,
    double? totalAmount,
    double? totalPaid,
    double? totalRemaining,
    double? totalOverdue,
    double? totalInterest,
    Map<String, double>? byCustomer,
    Map<String, int>? byStatus,
    List<Udhaar>? recentUdhaars,
    List<Udhaar>? overdueUdhaars,
  }) = _UdhaarSummary;

  factory UdhaarSummary.fromJson(Map<String, dynamic> json) => 
      _$UdhaarSummaryFromJson(json);
}

@freezed
class UdhaarStatement with _$UdhaarStatement {
  const factory UdhaarStatement({
    String? customerId,
    String? customerName,
    String? vendorId,
    DateTime? startDate,
    DateTime? endDate,
    List<Udhaar>? udhaars,
    List<UdhaarPayment>? payments,
    double? openingBalance,
    double? totalCredit,
    double? totalDebit,
    double? closingBalance,
    List<StatementEntry>? entries,
    DateTime? generatedAt,
  }) = _UdhaarStatement;

  factory UdhaarStatement.fromJson(Map<String, dynamic> json) => 
      _$UdhaarStatementFromJson(json);
}

@freezed
class StatementEntry with _$StatementEntry {
  const factory StatementEntry({
    String? id,
    DateTime? date,
    String? type,
    String? description,
    double? amount,
    double? balance,
    String? referenceId,
    String? referenceType,
  }) = _StatementEntry;

  factory StatementEntry.fromJson(Map<String, dynamic> json) => 
      _$StatementEntryFromJson(json);
}

@freezed
class UdhaarLimit with _$UdhaarLimit {
  const factory UdhaarLimit({
    String? id,
    String? customerId,
    double? creditLimit,
    double? usedAmount,
    double? availableAmount,
    DateTime? startDate,
    DateTime? endDate,
    bool? isActive,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _UdhaarLimit;

  factory UdhaarLimit.fromJson(Map<String, dynamic> json) => 
      _$UdhaarLimitFromJson(json);
}

// Udhaar Status
class UdhaarStatus {
  static const active = 'Active';
  static const partial = 'Partial';
  static const paid = 'Paid';
  static const overdue = 'Overdue';
  static const cancelled = 'Cancelled';
  static const writtenOff = 'Written Off';
  
  static const List<String> statuses = [
    active,
    partial,
    paid,
    overdue,
    cancelled,
    writtenOff,
  ];
}

// Reminder Type
class ReminderType {
  static const beforeDue = 'Before Due';
  static const onDueDate = 'On Due Date';
  static const afterDue = 'After Due';
  static const custom = 'Custom';
  
  static const List<String> types = [
    beforeDue,
    onDueDate,
    afterDue,
    custom,
  ];
}

// Reminder Via
class ReminderVia {
  static const sms = 'SMS';
  static const whatsapp = 'WhatsApp';
  static const email = 'Email';
  static const appNotification = 'App Notification';
  static const call = 'Call';
  
  static const List<String> methods = [
    sms,
    whatsapp,
    email,
    appNotification,
    call,
  ];
}

// Purpose Types
class UdhaarPurpose {
  static const order = 'Order';
  static const advance = 'Advance';
  static const loan = 'Loan';
  static const other = 'Other';
  
  static const List<String> purposes = [
    order,
    advance,
    loan,
    other,
  ];
}
