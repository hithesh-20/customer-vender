import 'package:flutter/material.dart';

class LoyaltyScreen extends StatelessWidget {
  const LoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Customer Loyalty Tiers')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          ListTile(title: Text('Bronze (0+ pts)'), subtitle: Text('1 pt per ₹25 spent')),
          ListTile(title: Text('Silver (200+ pts)'), subtitle: Text('Free Delivery above ₹250')),
          ListTile(title: Text('Gold (500+ pts)'), subtitle: Text('Extended Udhaar Khata Credit Limit')),
          ListTile(title: Text('Platinum (1000+ pts)'), subtitle: Text('Zero Delivery Fee + Priority Morning Dispatch')),
        ],
      ),
    );
  }
}
