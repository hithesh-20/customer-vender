import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';
import 'package:vendor_saathi/providers/product_provider.dart';
import 'package:vendor_saathi/providers/order_provider.dart';
import 'package:vendor_saathi/providers/connectivity_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductProvider>().fetchProducts();
      context.read<OrderProvider>().fetchOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final products = context.watch<ProductProvider>();
    final orders = context.watch<OrderProvider>();
    final online = context.watch<ConnectivityProvider>().isOnline;

    final todaySales = orders.orders.fold<double>(0, (s, o) => s + o.total);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user?.shopName ?? 'VendorSaathi Store', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
            Text(
              online ? 'Online • Auto-Sync Active' : 'Offline Mode • Queuing Locally',
              style: TextStyle(fontSize: 11, color: online ? Colors.green : Colors.orange),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.analytics_outlined), onPressed: () => context.push('/analytics')),
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () => context.push('/notifications')),
          IconButton(icon: const Icon(Icons.person_outline), onPressed: () => context.push('/profile')),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await products.fetchProducts();
          await orders.fetchOrders();
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF047857), Color(0xFF0D9488)]),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('ಕನ್ನಡ ಧ್ವನಿ ಸಹಾಯಕ • Kannada Voice POS', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 6),
                  const Text('“2 ಕೆಜಿ ಟೊಮ್ಯಾಟೋ ಬಿಲ್ ಮಾಡಿ”', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () => context.push('/voice'),
                    icon: const Icon(Icons.mic),
                    label: const Text('Speak Command'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                _StatCard(title: 'Total Revenue', value: '₹${todaySales.toStringAsFixed(0)}', icon: Icons.currency_rupee),
                _StatCard(title: 'Active Orders', value: '${orders.pendingOrders.length}', icon: Icons.local_shipping_outlined),
                _StatCard(title: 'Catalog Items', value: '${products.products.length}', icon: Icons.inventory_2_outlined),
                _StatCard(title: 'Low Stock Alerts', value: '${products.lowStockProducts.length}', icon: Icons.warning_amber_rounded),
              ],
            ),
            const SizedBox(height: 18),
            ListTile(
              tileColor: Colors.teal.withOpacity(0.08),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              leading: const Icon(Icons.wb_sunny_outlined, color: Colors.teal),
              title: const Text('Weather & Festive AI Demand Forecast'),
              subtitle: const Text('Check Deepavali restock predictions'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/analytics'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  const _StatCard({required this.title, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0.5,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: const Color(0xFF059669)),
            Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
            Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),
          ],
        ),
      ),
    );
  }
}
