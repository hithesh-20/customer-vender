import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/product_provider.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _nameCtrl = TextEditingController();
  final _knNameCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _stockCtrl = TextEditingController(text: '25');
  String _unit = 'kg';
  String _category = 'Groceries';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Product • ಹೊಸ ಉತ್ಪನ್ನ')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Product Name (English)')),
          const SizedBox(height: 12),
          TextField(controller: _knNameCtrl, decoration: const InputDecoration(labelText: 'ಕನ್ನಡ ಹೆಸರು (Kannada Name)')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _category,
            items: ['Groceries', 'Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Beverages']
                .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                .toList(),
            onChanged: (v) => setState(() => _category = v ?? 'Groceries'),
            decoration: const InputDecoration(labelText: 'Category'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _unit,
            items: ['kg', 'Liter', 'Packet', 'Piece', 'Dozen']
                .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                .toList(),
            onChanged: (v) => setState(() => _unit = v ?? 'kg'),
            decoration: const InputDecoration(labelText: 'Unit'),
          ),
          const SizedBox(height: 12),
          TextField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Selling Price (₹)')),
          const SizedBox(height: 12),
          TextField(controller: _stockCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Initial Stock')),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () async {
              await context.read<ProductProvider>().addProduct({
                'name': _nameCtrl.text.trim(),
                'kannadaName': _knNameCtrl.text.trim(),
                'category': _category,
                'unit': _unit,
                'price': double.tryParse(_priceCtrl.text) ?? 0,
                'stock': double.tryParse(_stockCtrl.text) ?? 0,
              });
              if (context.mounted) context.pop();
            },
            child: const Text('Save Product'),
          ),
        ],
      ),
    );
  }
}
