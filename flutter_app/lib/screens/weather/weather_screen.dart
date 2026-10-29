import 'package:flutter/material.dart';

class WeatherScreen extends StatelessWidget {
  const WeatherScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Coastal Retail Weather Advisory')),
      body: const Padding(
        padding: EdgeInsets.all(20),
        child: Text('Mudbidri / Coastal Karnataka • 29°C • Keep perishable greens covered during evening showers.'),
      ),
    );
  }
}
