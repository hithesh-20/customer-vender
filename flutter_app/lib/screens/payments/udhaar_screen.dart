import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/api_service.dart';

class UdhaarScreen extends StatefulWidget {
  const UdhaarScreen({super.key});

  @override
  State<UdhaarScreen> createState() => _UdhaarScreenState();
}

class _UdhaarScreenState extends State<UdhaarScreen> {
  List<dynamic> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await ApiService().get<List<dynamic>>(
      '/udhaar',
      fromJson: (json) => List<dynamic>.from(json),
    );
    if (mounted) {
      setState(() {
        _entries = res.data ?? [];
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Digital Udhaar Khata • ಉದಾರ್ ಖಾತಾ')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _entries.length,
              itemBuilder: (context, idx) {
                final u = Map<String, dynamic>.from(_entries[idx]);
                return Card(
                  child: ListTile(
                    title: Text('${u["customerName"]} • ₹${u["remainingAmount"]} due'),
                    subtitle: Text('${u["description"] ?? ""} (${u["status"]})'),
                  ),
                );
              },
            ),
    );
  }
}
