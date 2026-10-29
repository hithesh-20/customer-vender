import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:vendor_saathi/services/api_service.dart';

class CustomerListScreen extends StatefulWidget {
  const CustomerListScreen({super.key});

  @override
  State<CustomerListScreen> createState() => _CustomerListScreenState();
}

class _CustomerListScreenState extends State<CustomerListScreen> {
  List<dynamic> _customers = [];

  @override
  void initState() {
    super.initState();
    ApiService()
        .get<List<dynamic>>('/customers', fromJson: (j) => List<dynamic>.from(j))
        .then((r) {
          if (mounted) setState(() => _customers = r.data ?? []);
        });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Customers • ಗ್ರಾಹಕರು')),
      body: ListView.builder(
        itemCount: _customers.length,
        itemBuilder: (context, idx) {
          final c = Map<String, dynamic>.from(_customers[idx]);
          return ListTile(
            title: Text('${c["name"]} (${c["loyaltyTier"]})'),
            subtitle: Text('${c["phone"]} • Spent: ₹${c["totalSpent"]}'),
            onTap: () => context.push('/customers/${c["id"]}'),
          );
        },
      ),
    );
  }
}
