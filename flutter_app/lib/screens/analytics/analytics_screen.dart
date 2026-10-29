import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/api_service.dart';

class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _forecast;

  @override
  void initState() {
    super.initState();
    ApiService()
        .get<Map<String, dynamic>>(
          '/analytics/demand?days=7&festival=Deepavali',
          fromJson: (json) => Map<String, dynamic>.from(json),
        )
        .then((res) {
          if (mounted) setState(() => _forecast = res.data);
        });
  }

  @override
  Widget build(BuildContext context) {
    final items = (_forecast?['forecasts'] as List?) ?? [];
    return Scaffold(
      appBar: AppBar(title: const Text('AI Demand Forecast • ಮುನ್ಸೂಚನೆ')),
      body: items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (context, idx) {
                final f = Map<String, dynamic>.from(items[idx]);
                return Card(
                  child: ListTile(
                    title: Text('${f["name"]} (${f["urgency"]})'),
                    subtitle: Text(
                      '7d Demand: ${f["predictedDemand"]} ${f["unit"]} • Suggested Restock: +${f["recommendedRestock"]} ${f["unit"]}',
                    ),
                  ),
                );
              },
            ),
    );
  }
}
