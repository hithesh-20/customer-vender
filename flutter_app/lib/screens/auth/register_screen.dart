import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _shopCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Register Store')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Owner Name')),
          const SizedBox(height: 12),
          TextField(controller: _shopCtrl, decoration: const InputDecoration(labelText: 'Shop Name')),
          const SizedBox(height: 12),
          TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Mobile Number')),
          const SizedBox(height: 12),
          TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: auth.isLoading
                ? null
                : () async {
                    final ok = await auth.register(
                      name: _nameCtrl.text.trim(),
                      phone: _phoneCtrl.text.trim(),
                      password: _passCtrl.text.trim(),
                      shopName: _shopCtrl.text.trim(),
                    );
                    if (ok && context.mounted) context.go('/home');
                  },
            child: const Text('Create Store Account'),
          ),
        ],
      ),
    );
  }
}
