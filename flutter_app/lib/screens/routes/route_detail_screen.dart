import 'package:flutter/material.dart';

class RouteDetailScreen extends StatelessWidget {
  final String routeId;
  const RouteDetailScreen({super.key, required this.routeId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Route Navigation')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Text('Turn-by-turn dispatch details for Route $routeId'),
      ),
    );
  }
}
