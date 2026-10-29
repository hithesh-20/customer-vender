import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/product_provider.dart';

class ProductListScreen extends StatelessWidget {
  const ProductListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProductProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory & Catalog • ಉತ್ಪನ್ನಗಳು'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box_outlined),
            onPressed: () => context.push('/products/add'),
          ),
        ],
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: provider.products.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, idx) {
                final p = provider.products[idx];
                return Card(
                  child: ListTile(
                    title: Text('${p.name} ${p.kannadaName != null ? "• ${p.kannadaName}" : ""}'),
                    subtitle: Text('₹${p.price}/${p.unit} • Stock: ${p.stock} ${p.unit}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline, color: Color(0xFF059669)),
                          onPressed: () => provider.adjustStock(p.id, 5),
                        ),
                        IconButton(
                          icon: const Icon(Icons.edit_outlined),
                          onPressed: () => context.push('/products/edit', extra: p),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
