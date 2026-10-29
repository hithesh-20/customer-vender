import 'package:flutter/material.dart';
import 'package:vendor_saathi/models/product_model.dart';

class EditProductScreen extends StatelessWidget {
  final Product? product;
  const EditProductScreen({super.key, this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Edit ${product?.name ?? "Product"}')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Text('Editing SKU & pricing for ${product?.name ?? "selected item"}'),
      ),
    );
  }
}
