import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/api_service.dart';

class PaymentListScreen extends StatefulWidget {
  const PaymentListScreen({super.key});

  @override
  State<PaymentListScreen> createState() => _PaymentListScreenState();
}

class _PaymentListScreenState extends State<PaymentListScreen> {
  List<dynamic> _payments = [];

  @override
  void initState() {
    super.initState();
    ApiService()
        .get<List<dynamic>>('/payments', fromJson: (j) => List<dynamic>.from(j))
        .then((r) {
          if (mounted) setState(() => _payments = r.data ?? []);
        });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payments & UPI • ಪಾವತಿಗಳು')),
      body: ListView.builder(
        itemCount: _payments.length,
        itemBuilder: (context, idx) {
          final p = Map<String, dynamic>.from(_payments[idx]);
          return ListTile(
            title: Text('₹${p["amount"]} • ${p["paymentMethod"]}'),
            subtitle: Text('${p["customerName"] ?? "Customer"} • ${p["paymentNumber"]}'),
          );
        },
      ),
    );
  }
}
