import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final auth = context.read<AuthProvider>();
    await auth.initialize();
    await Future.delayed(const Duration(milliseconds: 900));
    if (!mounted) return;
    context.go(auth.isAuthenticated ? '/home' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF047857),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            CircleAvatar(
              radius: 42,
              backgroundColor: Colors.white,
              child: Text(
                'VS',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF047857),
                ),
              ),
            ),
            SizedBox(height: 20),
            Text(
              'VendorSaathi • ವೆಂಡರ್ ಸಾಥಿ',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'AI Voice Commerce & Smart Mobility',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            SizedBox(height: 28),
            CircularProgressIndicator(color: Colors.white),
          ],
        ),
      ),
    );
  }
}
