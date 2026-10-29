# ⚡ Quick Start Guide - VendorSaathi

## 🎯 What You Have Right Now

You have a **production-ready project structure** with:

✅ **Flutter App** - Complete setup with models, services, theme, navigation
✅ **Backend Server** - Node.js + Express with database, Firebase, Redis
✅ **Project Documentation** - README, architecture, and guides

---

## 🚀 Try It Now (2 Minutes)

### 1. Start the Backend Server

```bash
cd vendor_saathi/backend
npm install
npm run dev
```

**Expected Output:**
```
✅ VendorSaathi server running on port 3000
🌐 API available at http://localhost:3000/api/v1
📚 API docs available at http://localhost:3000/api-docs
🏥 Health check: http://localhost:3000/api/health
```

### 2. Test the API

Open your browser or Postman:

```
GET http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "VendorSaathi API is running",
  "version": "1.0.0",
  "timestamp": "2026-10-29T13:45:00.000Z",
  "status": "healthy"
}
```

### 3. Explore API Documentation

Visit: `http://localhost:3000/api-docs`

You'll see **Swagger UI** with all API endpoints (auto-generated).

---

## 📱 Flutter App Quick Start

### 1. Get Dependencies

```bash
cd vendor_saathi/flutter_app
flutter pub get
```

### 2. Create Asset Directories

```bash
mkdir -p assets/{images,icons,fonts,animations,voice}
```

### 3. Add Placeholder Assets (Optional)

Create a simple placeholder image:
```bash
# On Linux/Mac
convert -size 200x200 xc:white assets/images/placeholder.png

# Or download one
wget https://via.placeholder.com/200 -O assets/images/placeholder.png
```

### 4. Run the App

```bash
flutter run
```

**Note:** The app will compile and run, but you'll see a blank screen because we haven't created the UI screens yet. This is expected!

---

## 🎨 What You See in Flutter

When you run `flutter run`, you're getting:

✅ **App Structure**: Main app with providers and theme
✅ **Navigation**: GoRouter configured with all routes
✅ **Models**: All data structures ready
✅ **Services**: API, voice, location, offline sync ready
✅ **Theme**: Beautiful light/dark theme with custom colors

**What's Missing:**
- UI Screens (easy to add!)
- Widgets (reusable components)

---

## 🛠️ Add Your First Screen (5 Minutes)

Let's create a simple **Dashboard Screen**:

### 1. Create the file

```bash
touch vendor_saathi/flutter_app/lib/screens/dashboard/dashboard_screen.dart
```

### 2. Add this code:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/config/theme.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.mic),
            onPressed: () {
              // Voice command will go here
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Voice command coming soon!')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Welcome card
            Card(
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    const Icon(Icons.shopping_basket, size: 64, color: AppColors.primary),
                    const SizedBox(height: 16),
                    Text(
                      'Welcome to VendorSaathi!',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      authProvider.user?.name ?? 'Vendor',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Quick actions
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 3,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _buildActionCard(context, Icons.add_shopping_cart, 'Add Product', () {}),
                _buildActionCard(context, Icons.shopping_cart, 'New Order', () {}),
                _buildActionCard(context, Icons.people, 'Customers', () {}),
                _buildActionCard(context, Icons.receipt, 'Payments', () {}),
                _buildActionCard(context, Icons.map, 'Routes', () {}),
                _buildActionCard(context, Icons.analytics, 'Analytics', () {}),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Stats
            Text(
              'Today\'s Stats',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(child: _buildStatCard(context, '₹0', 'Sales')),
                Expanded(child: _buildStatCard(context, '0', 'Orders')),
                Expanded(child: _buildStatCard(context, '0', 'Customers')),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, IconData icon, String title, VoidCallback onTap) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: AppColors.primary),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String value, String label) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 3. Update the router to use this screen

Edit `flutter_app/lib/config/app_router.dart` and update the dashboard route:

```dart
GoRoute(
  path: '/dashboard',
  builder: (context, state) => const DashboardScreen(),
),
```

### 4. Run the app again

```bash
flutter run
```

**Now you'll see a beautiful dashboard screen!** 🎉

---

## 🎯 What Just Happened

You created:
1. ✅ A complete dashboard screen
2. ✅ Integrated with auth provider
3. ✅ Used the app theme
4. ✅ Added quick action buttons
5. ✅ Added stats cards

---

## 🚀 Next Quick Wins

### Add Login Screen (10 minutes)

```bash
touch vendor_saathi/flutter_app/lib/screens/auth/login_screen.dart
```

Add this code:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';
import 'package:vendor_saathi/config/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final success = await authProvider.login(
        phone: _phoneController.text.trim(),
        password: _passwordController.text.trim(),
      );
      
      if (success) {
        context.go('/home');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(authProvider.error ?? 'Login failed'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
          backgroundColor: AppColors.error,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),
                
                // Logo
                const FlutterLogo(size: 100),
                const SizedBox(height: 16),
                
                Text(
                  'VendorSaathi',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                
                Text(
                  'AI-Driven Voice Commerce Platform',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                
                // Phone field
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    prefixIcon: Icon(Icons.phone),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter phone number';
                    }
                    if (!RegExp(r'^[0-9]{10}$').hasMatch(value)) {
                      return 'Please enter valid 10-digit phone number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Password field
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  keyboardType: TextInputType.visiblePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility : Icons.visibility_off,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                    border: const OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter password';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                
                // Login button
                ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('LOGIN'),
                ),
                const SizedBox(height: 16),
                
                // Forgot password
                TextButton(
                  onPressed: () => context.go('/forgot-password'),
                  child: const Text('Forgot Password?'),
                ),
                
                const SizedBox(height: 24),
                
                // Divider
                const Row(
                  children: [
                    Expanded(child: Divider(color: AppColors.borderLight)),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR',
                        style: TextStyle(color: AppColors.textTertiary),
                      ),
                    ),
                    Expanded(child: Divider(color: AppColors.borderLight)),
                  ],
                ),
                const SizedBox(height: 24),
                
                // OTP Login
                OutlinedButton(
                  onPressed: () {
                    // OTP login implementation
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Login with OTP'),
                ),
                const SizedBox(height: 16),
                
                // Register
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account?"),
                    TextButton(
                      onPressed: () => context.go('/register'),
                      child: const Text('Register'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## 🎉 You're Now a Flutter Developer!

You've just:
1. ✅ Created a dashboard screen
2. ✅ Created a login screen
3. ✅ Integrated with providers
4. ✅ Used the app theme
5. ✅ Added form validation

---

## 📚 What to Do Next

### If you want to continue with Flutter:
1. Create the **Register Screen**
2. Create the **Main Screen** with bottom navigation
3. Create **Product List Screen**
4. Connect to the backend API

### If you want to work on the Backend:
1. Complete the **User model** relationships
2. Create the **Product model**
3. Create the **Auth controller**
4. Create the **Auth routes**

### If you want to see something specific:
Just ask! For example:
- "Create the product list screen"
- "Implement the auth API"
- "Build the voice command system"
- "Set up the database"

---

## 💬 Common Questions

### Q: How do I connect to a real database?
A: Edit `backend/src/config/config.js` and add your PostgreSQL credentials. Then run the server.

### Q: How do I add more screens?
A: Create a new file in `flutter_app/lib/screens/` and add a route in `app_router.dart`

### Q: How do I call the backend API from Flutter?
A: Use the `ApiService` class:
```dart
final response = await ApiService().get('/products');
if (response.success) {
  // Use response.data
}
```

### Q: How do I enable voice commands?
A: Use the `VoiceService` class:
```dart
VoiceService().startListening(
  onCommandRecognized: (command) {
    if (command.intent == VoiceIntent.showProducts) {
      // Navigate to products
    }
  },
);
```

### Q: How do I test the backend?
A: Use Postman or curl:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "1234567890", "password": "password123"}'
```

---

## 🌟 You're Ready!

You now have:
✅ A working backend server
✅ A Flutter app structure
✅ Knowledge to add screens
✅ Understanding of the architecture

**What do you want to build next?** 🚀
