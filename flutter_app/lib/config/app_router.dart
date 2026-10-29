import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';
import 'package:vendor_saathi/screens/splash_screen.dart';
import 'package:vendor_saathi/screens/auth/login_screen.dart';
import 'package:vendor_saathi/screens/auth/register_screen.dart';
import 'package:vendor_saathi/screens/auth/forgot_password_screen.dart';
import 'package:vendor_saathi/screens/auth/verify_otp_screen.dart';
import 'package:vendor_saathi/screens/main_screen.dart';
import 'package:vendor_saathi/screens/dashboard/dashboard_screen.dart';
import 'package:vendor_saathi/screens/products/product_list_screen.dart';
import 'package:vendor_saathi/screens/products/add_product_screen.dart';
import 'package:vendor_saathi/screens/products/edit_product_screen.dart';
import 'package:vendor_saathi/screens/orders/order_list_screen.dart';
import 'package:vendor_saathi/screens/orders/order_detail_screen.dart';
import 'package:vendor_saathi/screens/orders/create_order_screen.dart';
import 'package:vendor_saathi/screens/customers/customer_list_screen.dart';
import 'package:vendor_saathi/screens/customers/customer_detail_screen.dart';
import 'package:vendor_saathi/screens/inventory/inventory_screen.dart';
import 'package:vendor_saathi/screens/payments/payment_list_screen.dart';
import 'package:vendor_saathi/screens/payments/udhaar_screen.dart';
import 'package:vendor_saathi/screens/routes/route_planner_screen.dart';
import 'package:vendor_saathi/screens/routes/route_detail_screen.dart';
import 'package:vendor_saathi/screens/analytics/analytics_screen.dart';
import 'package:vendor_saathi/screens/voice/voice_command_screen.dart';
import 'package:vendor_saathi/screens/settings/settings_screen.dart';
import 'package:vendor_saathi/screens/profile/profile_screen.dart';
import 'package:vendor_saathi/screens/weather/weather_screen.dart';
import 'package:vendor_saathi/screens/loyalty/loyalty_screen.dart';
import 'package:vendor_saathi/screens/notifications/notification_screen.dart';
import 'package:vendor_saathi/models/product_model.dart';
import 'package:vendor_saathi/models/order_model.dart';
import 'package:vendor_saathi/models/customer_model.dart';
import 'package:vendor_saathi/models/route_model.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class AppRouter {
  static final GoRouter router = GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    
    // Redirect logic based on auth state
    redirect: (BuildContext context, GoRouterState state) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final isLoggedIn = authProvider.isAuthenticated;
      final isOnboarded = authProvider.isOnboarded;
      
      // Allow these routes without authentication
      final publicRoutes = [
        '/splash',
        '/login',
        '/register',
        '/forgot-password',
        '/verify-otp',
      ];
      
      // If trying to access a public route while logged in, redirect to home
      if (isLoggedIn && publicRoutes.contains(state.location)) {
        return '/home';
      }
      
      // If trying to access a protected route without login, redirect to login
      if (!isLoggedIn && !publicRoutes.contains(state.location)) {
        return '/login';
      }
      
      // If logged in but not onboarded, redirect to onboarding
      if (isLoggedIn && !isOnboarded && state.location != '/onboarding') {
        return '/onboarding';
      }
      
      return null; // No redirect
    },
    
    routes: [
      // Splash Screen
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Authentication Routes
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/verify-otp',
        builder: (context, state) {
          final email = state.extra as String?;
          return VerifyOtpScreen(email: email);
        },
      ),
      
      // Main Screen (Bottom Navigation)
      GoRoute(
        path: '/home',
        builder: (context, state) => const MainScreen(),
      ),
      
      // Dashboard
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      
      // Products
      GoRoute(
        path: '/products',
        builder: (context, state) => const ProductListScreen(),
      ),
      GoRoute(
        path: '/products/add',
        builder: (context, state) => const AddProductScreen(),
      ),
      GoRoute(
        path: '/products/edit',
        builder: (context, state) {
          final product = state.extra as Product?;
          return EditProductScreen(product: product);
        },
      ),
      
      // Orders
      GoRoute(
        path: '/orders',
        builder: (context, state) => const OrderListScreen(),
      ),
      GoRoute(
        path: '/orders/create',
        builder: (context, state) => const CreateOrderScreen(),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (context, state) {
          final orderId = state.pathParams['id']!;
          return OrderDetailScreen(orderId: orderId);
        },
      ),
      
      // Customers
      GoRoute(
        path: '/customers',
        builder: (context, state) => const CustomerListScreen(),
      ),
      GoRoute(
        path: '/customers/:id',
        builder: (context, state) {
          final customerId = state.pathParams['id']!;
          return CustomerDetailScreen(customerId: customerId);
        },
      ),
      
      // Inventory
      GoRoute(
        path: '/inventory',
        builder: (context, state) => const InventoryScreen(),
      ),
      
      // Payments
      GoRoute(
        path: '/payments',
        builder: (context, state) => const PaymentListScreen(),
      ),
      GoRoute(
        path: '/udhaar',
        builder: (context, state) => const UdhaarScreen(),
      ),
      
      // Routes
      GoRoute(
        path: '/routes',
        builder: (context, state) => const RoutePlannerScreen(),
      ),
      GoRoute(
        path: '/routes/:id',
        builder: (context, state) {
          final routeId = state.pathParams['id']!;
          return RouteDetailScreen(routeId: routeId);
        },
      ),
      
      // Analytics
      GoRoute(
        path: '/analytics',
        builder: (context, state) => const AnalyticsScreen(),
      ),
      
      // Voice
      GoRoute(
        path: '/voice',
        builder: (context, state) => const VoiceCommandScreen(),
      ),
      
      // Settings
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      
      // Profile
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      
      // Weather
      GoRoute(
        path: '/weather',
        builder: (context, state) => const WeatherScreen(),
      ),
      
      // Loyalty
      GoRoute(
        path: '/loyalty',
        builder: (context, state) => const LoyaltyScreen(),
      ),
      
      // Notifications
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationScreen(),
      ),
    ],
    
    // Error page
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page Not Found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.error?.message ?? 'Unknown error',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}
