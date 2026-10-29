import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatelessWidget {
  const ForgotPasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final phoneCtrl = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password via OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            TextField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Registered Phone Number'),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('OTP sent to your registered mobile number')),
                );
              },
              child: const Text('Send OTP'),
            ),
          ],
        ),
      ),
    );
  }
}
