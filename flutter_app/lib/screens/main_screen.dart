import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:vendor_saathi/screens/dashboard/dashboard_screen.dart';
import 'package:vendor_saathi/screens/orders/order_list_screen.dart';
import 'package:vendor_saathi/screens/products/product_list_screen.dart';
import 'package:vendor_saathi/screens/payments/udhaar_screen.dart';
import 'package:vendor_saathi/screens/routes/route_planner_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    DashboardScreen(),
    OrderListScreen(),
    ProductListScreen(),
    UdhaarScreen(),
    RoutePlannerScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _tabs),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: const Color(0xFF059669),
        foregroundColor: Colors.white,
        onPressed: () => context.push('/voice'),
        icon: const Icon(Icons.mic),
        label: const Text('ಧ್ವನಿ AI'),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.receipt_long_outlined), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), label: 'Stock'),
          NavigationDestination(icon: Icon(Icons.menu_book_outlined), label: 'Udhaar'),
          NavigationDestination(icon: Icon(Icons.alt_route_outlined), label: 'Routes'),
        ],
      ),
    );
  }
}
