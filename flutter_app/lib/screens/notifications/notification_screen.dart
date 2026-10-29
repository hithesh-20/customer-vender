import 'package:flutter/material.dart';
import 'package:vendor_saathi/services/api_service.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<dynamic> _items = [];

  @override
  void initState() {
    super.initState();
    ApiService()
        .get<Map<String, dynamic>>('/notifications', fromJson: (j) => Map<String, dynamic>.from(j))
        .then((r) {
          if (mounted) setState(() => _items = (r.data?['notifications'] as List?) ?? []);
        });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Alerts & Notifications')),
      body: ListView.builder(
        itemCount: _items.length,
        itemBuilder: (context, idx) {
          final n = Map<String, dynamic>.from(_items[idx]);
          return ListTile(
            leading: const Icon(Icons.notifications_active_outlined, color: Color(0xFF059669)),
            title: Text('${n["title"]}'),
            subtitle: Text('${n["body"]}'),
          );
        },
      ),
    );
  }
}
