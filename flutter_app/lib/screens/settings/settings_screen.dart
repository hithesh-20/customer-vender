import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Store Settings • ಸೆಟ್ಟಿಂಗ್ಸ್')),
      body: ListView(
        children: const [
          SwitchListTile(value: true, onChanged: null, title: Text('Kannada Voice Feedback (ಕನ್ನಡ ಧ್ವನಿ)')),
          SwitchListTile(value: true, onChanged: null, title: Text('Offline Hive Auto-Sync')),
          SwitchListTile(value: true, onChanged: null, title: Text('Free Delivery Above ₹400')),
        ],
      ),
    );
  }
}
