import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/order_provider.dart';
import 'package:vendor_saathi/providers/product_provider.dart';

class CreateOrderScreen extends StatefulWidget {
  const CreateOrderScreen({super.key});

  @override
  State<CreateOrderScreen> createState() => _CreateOrderScreenState();
}

class _CreateOrderScreenState extends State<CreateOrderScreen> {
  final Map<String, int> _cart = {};
  String _paymentMethod = 'UPI';

  @override
  Widget build(BuildContext context) {
    final products = context.watch<ProductProvider>().products;
    return Scaffold(
      appBar: AppBar(title: const Text('Quick POS Counter • ಬಿಲ್ಲಿಂಗ್')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: products.length,
              itemBuilder: (context, idx) {
                final p = products[idx];
                final qty = _cart[p.id] ?? 0;
                return ListTile(
                  title: Text(p.name),
                  subtitle: Text('₹${p.price} / ${p.unit}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline),
                        onPressed: qty > 0 ? () => setState(() => _cart[p.id] = qty - 1) : null,
                      ),
                      Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline),
                        onPressed: () => setState(() => _cart[p.id] = qty + 1),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                DropdownButton<String>(
                  value: _paymentMethod,
                  items: ['UPI', 'Cash', 'Udhaar']
                      .map((m) => DropdownMenuItem(value: m, child: Text(m)))
                      .toList(),
                  onChanged: (v) => setState(() => _paymentMethod = v ?? 'UPI'),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: _cart.values.every((q) => q == 0)
                        ? null
                        : () async {
                            final items = _cart.entries
                                .where((e) => e.value > 0)
                                .map((e) => {'productId': e.key, 'quantity': e.value})
                                .toList();
                            await context.read<OrderProvider>().createOrder({
                              'type': 'Walk-in',
                              'paymentMethod': _paymentMethod,
                              'items': items,
                            });
                            if (context.mounted) context.pop();
                          },
                    child: const Text('Generate Bill'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
