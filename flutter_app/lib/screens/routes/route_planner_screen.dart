import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/location_provider.dart';

class RoutePlannerScreen extends StatelessWidget {
  const RoutePlannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final loc = context.watch<LocationProvider>();
    final opt = loc.activeOptimization?['optimization'];
    final stops = (opt?['stops'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('2-Opt Smart Mobility • ರೂಟ್')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FilledButton.icon(
              onPressed: loc.isOptimizing ? null : () => loc.optimizeActiveOrders(),
              icon: const Icon(Icons.alt_route),
              label: Text(loc.isOptimizing ? 'Optimizing 2-Opt Tour...' : 'Optimize Active Delivery Orders'),
            ),
            const SizedBox(height: 16),
            if (opt != null)
              Card(
                color: Colors.teal.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Text(
                    'Total: ${opt["totalDistanceKm"]} km • Saved ${opt["distanceSavedKm"]} km (₹${opt["fuelSavedInr"]} fuel)',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            Expanded(
              child: ListView.builder(
                itemCount: stops.length,
                itemBuilder: (context, idx) {
                  final s = Map<String, dynamic>.from(stops[idx]);
                  return ListTile(
                    leading: CircleAvatar(child: Text('${s["sequence"]}')),
                    title: Text('${s["name"]} • ₹${s["orderAmount"]}'),
                    subtitle: Text('${s["address"]} • ETA ${s["etaMinutesFromStart"]}m'),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
