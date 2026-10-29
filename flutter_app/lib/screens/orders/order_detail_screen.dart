import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/order_provider.dart';

class OrderDetailScreen extends StatelessWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<OrderProvider>();
    final order = provider.orders.where((o) => o.id == orderId).firstOrNull;

    return Scaffold(
      appBar: AppBar(title: Text('Order ${order?.orderNumber ?? orderId}')),
      body: order == null
          ? const Center(child: Text('Order details loaded from API'))
          : Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Status: ${order.status}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Total Amount: ₹${order.total.toStringAsFixed(2)}'),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () => provider.updateOrderStatus(order.id, 'Delivered'),
                    child: const Text('Mark as Delivered'),
                  ),
                ],
              ),
            ),
    );
  }
}
