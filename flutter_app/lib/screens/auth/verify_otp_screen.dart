import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class VerifyOtpScreen extends StatelessWidget {
  final String? email;
  const VerifyOtpScreen({super.key, this.email});

  @override
  Widget build(BuildContext context) {
    final otpCtrl = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: const Text('Verify OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text('Enter 6-digit OTP${email != null ? ' sent to $email' : ''}'),
            const SizedBox(height: 16),
            TextField(
              controller: otpCtrl,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(labelText: '6-Digit OTP', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.go('/home'),
              child: const Text('Verify & Continue'),
            ),
          ],
        ),
      ),
    );
  }
}
