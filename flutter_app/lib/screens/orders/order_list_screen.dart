import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/order_provider.dart';

class OrderListScreen extends StatelessWidget {
  const OrderListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrderProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders & POS • ಆರ್ಡರ್‌ಗಳು'),
        actions: [
          IconButton(
            icon: const Icon(Icons.point_of_sale),
            onPressed: () => context.push('/orders/create'),
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: provider.orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, idx) {
                final o = provider.orders[idx];
                return Card(
                  child: ListTile(
                    title: Text('${o.orderNumber ?? o.id} • ₹${o.total.toStringAsFixed(0)}'),
                    subtitle: Text('${o.status} • ${o.paymentMethod ?? "UPI"}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/orders/${o.id}'),
                  ),
                );
              },
            ),
    );
  }
}
