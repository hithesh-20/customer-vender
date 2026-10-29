# VendorSaathi - Flutter App

## 📱 Overview

This is the **Vendor Android App** for **VendorSaathi** - an AI-Driven Voice Commerce & Intelligent Mobility Platform for Vendors. Built with **Flutter** and designed to work seamlessly with the backend API and AI services.

## 🚀 Features

### ✅ Core Features
- **Kannada Voice Assistance** - Full voice-based interaction with Kannada support
- **Offline-First** - Works without internet, auto-syncs when online
- **GPS & Route Optimization** - Intelligent route planning with demand forecasting
- **AI Demand Prediction** - Predicts product demand using historical data
- **Multi-Payment Support** - Cash, UPI, Bank Transfer, Cheque, Wallet, Udhaar
- **Customer Management** - Track customers, loyalty points, and purchase history
- **Inventory Management** - Manage products, stock levels, and suppliers
- **Order Management** - Create, track, and manage orders efficiently
- **Real-time Analytics** - Sales, profit, and business performance insights
- **Weather Integration** - Get weather forecasts and alerts

### 🎤 Voice Commands (Kannada)

| Command | English | Action |
|---------|---------|--------|
| ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ | Show my products | Opens product list |
| ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ | Create new product | Opens add product screen |
| ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ | Show orders | Opens order list |
| ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ | Create new order | Opens create order screen |
| ಇಂದಿನ ಮಾರಾಟ ವರದಿ | Today sales report | Shows today's sales |
| ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ | Optimize route | Optimizes delivery route |
| ನನ್ನ ಸ್ಥಳ ತೋರಿಸಿ | Show my location | Shows current location |
| ಹಣ ಪಾವತಿ ಮಾಡಿ | Make payment | Opens payment screen |
| ಉಧಾರ್ ಮಾಹಿತಿ ತೋರಿಸಿ | Show Udhaar | Opens Udhaar screen |
| ಹವಾಮಾನ ಮಾಹಿತಿ ತೋರಿಸಿ | Show weather | Shows weather information |
| ಹಿಂತಿರುಗಿ | Go back | Navigates back |
| ಮುಖಪುಟ | Home | Navigates to home |
| ಸೆಟ್ಟಿಂಗ್‍ಗಳು | Settings | Opens settings |
| ಸಹಾಯ | Help | Shows help |

## 🛠️ Tech Stack

- **Framework**: Flutter 3.x
- **State Management**: Provider + Riverpod
- **Local Storage**: Hive
- **Network**: Dio
- **Authentication**: Firebase Auth + JWT
- **GPS**: Geolocator + Google Maps Flutter
- **Voice**: speech_to_text + flutter_tts
- **Payments**: Razorpay Flutter
- **Charts**: fl_chart + syncfusion_flutter_charts
- **Navigation**: go_router
- **UI**: flutter_screenutil + google_fonts
- **Offline Sync**: Workmanager + Background Fetch

## 📦 Dependencies

All dependencies are listed in `pubspec.yaml`. Run:

```bash
flutter pub get
```

## 🏗️ Project Structure

```
lib/
├── config/
│   ├── app_router.dart      # GoRouter configuration
│   └── theme.dart           # App theme & colors
│
├── models/
│   ├── user_model.dart      # User data model
│   ├── product_model.dart   # Product data model
│   ├── order_model.dart     # Order data model
│   ├── customer_model.dart  # Customer data model
│   ├── route_model.dart     # Route & GPS data model
│   ├── payment_model.dart   # Payment data model
│   ├── udhaar_model.dart    # Udhaar (credit) data model
│   ├── analytics_model.dart  # Analytics data model
│   └── voice_command_model.dart  # Voice command model
│
├── providers/
│   ├── auth_provider.dart   # Authentication state
│   ├── product_provider.dart  # Product state
│   ├── order_provider.dart   # Order state
│   ├── voice_provider.dart   # Voice service state
│   ├── location_provider.dart # GPS state
│   └── connectivity_provider.dart # Network state
│
├── services/
│   ├── api_service.dart     # API client
│   ├── voice_service.dart    # Voice recognition & TTS
│   ├── location_service.dart # GPS & location tracking
│   ├── offline_sync_service.dart # Offline data sync
│   └── ...
│
├── screens/
│   ├── splash_screen.dart
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   ├── forgot_password_screen.dart
│   │   └── verify_otp_screen.dart
│   │
│   ├── main_screen.dart      # Bottom navigation
│   │
│   ├── dashboard/
│   │   └── dashboard_screen.dart
│   │
│   ├── products/
│   │   ├── product_list_screen.dart
│   │   ├── add_product_screen.dart
│   │   └── edit_product_screen.dart
│   │
│   ├── orders/
│   │   ├── order_list_screen.dart
│   │   ├── order_detail_screen.dart
│   │   └── create_order_screen.dart
│   │
│   ├── customers/
│   │   ├── customer_list_screen.dart
│   │   └── customer_detail_screen.dart
│   │
│   ├── inventory/
│   │   └── inventory_screen.dart
│   │
│   ├── payments/
│   │   ├── payment_list_screen.dart
│   │   └── udhaar_screen.dart
│   │
│   ├── routes/
│   │   ├── route_planner_screen.dart
│   │   └── route_detail_screen.dart
│   │
│   ├── analytics/
│   │   └── analytics_screen.dart
│   │
│   ├── voice/
│   │   └── voice_command_screen.dart
│   │
│   ├── settings/
│   │   └── settings_screen.dart
│   │
│   ├── profile/
│   │   └── profile_screen.dart
│   │
│   ├── weather/
│   │   └── weather_screen.dart
│   │
│   ├── loyalty/
│   │   └── loyalty_screen.dart
│   │
│   └── notifications/
│       └── notification_screen.dart
│
├── widgets/
│   ├── common/
│   │   ├── app_bar.dart
│   │   ├── drawer.dart
│   │   ├── loading_indicator.dart
│   │   ├── empty_state.dart
│   │   ├── error_state.dart
│   │   ├── confirm_dialog.dart
│   │   └── toast.dart
│   │
│   ├── cards/
│   │   ├── product_card.dart
│   │   ├── order_card.dart
│   │   ├── customer_card.dart
│   │   ├── stat_card.dart
│   │   └── payment_card.dart
│   │
│   ├── forms/
│   │   ├── text_field.dart
│   │   ├── dropdown_field.dart
│   │   ├── number_field.dart
│   │   ├── date_field.dart
│   │   └── form_validator.dart
│   │
│   ├── lists/
│   │   ├── product_list.dart
│   │   ├── order_list.dart
│   │   ├── customer_list.dart
│   │   └── payment_list.dart
│   │
│   ├── buttons/
│   │   ├── primary_button.dart
│   │   ├── secondary_button.dart
│   │   ├── icon_button.dart
│   │   └── voice_button.dart
│   │
│   └── dialogs/
│       ├── success_dialog.dart
│       ├── error_dialog.dart
│       ├── confirm_dialog.dart
│       └── info_dialog.dart
│
└── utils/
    ├── constants.dart       # App constants
    ├── helpers.dart         # Helper functions
    ├── validators.dart      # Form validators
    ├── formatters.dart      # Data formatters
    └── extensions.dart      # Dart extensions
```

## 📡 API Endpoints

All API endpoints are defined in `lib/utils/constants.dart`. The app communicates with:

- **Backend API**: `http://localhost:3000/api/v1` (Node.js)
- **AI Services**: `http://localhost:5000/api/v1` (Python/FastAPI)
- **Firebase**: For authentication and notifications
- **Google Maps**: For location and routing
- **Weather API**: For weather information
- **Razorpay**: For payment processing

## 🎨 UI Components

### Colors
Defined in `lib/config/theme.dart`:

```dart
AppColors.primary        // Primary brand color
AppColors.secondary      // Secondary brand color
AppColors.accent         // Accent color
AppColors.success        // Success/green
AppColors.warning        // Warning/yellow
AppColors.error          // Error/red
AppColors.info           // Info/blue
```

### Typography
Uses **Google Fonts - Poppins** for English and **Noto Sans Kannada** for Kannada.

## 🔐 Authentication Flow

1. **Splash Screen** → Check auth state
2. **Login Screen** → Phone + Password or OTP
3. **OTP Verification** → For OTP-based login
4. **Onboarding** → For new users
5. **Main App** → Bottom navigation with all features

## 📱 Navigation

Uses **go_router** for declarative navigation:

```dart
// Navigate to a screen
context.go('/products');

// Navigate with parameters
context.go('/products/edit', extra: product);

// Navigate back
context.pop();
```

## 🗣️ Voice Integration

The app supports **Kannada voice commands** using:

- **speech_to_text**: For voice recognition
- **flutter_tts**: For text-to-speech
- Custom **VoiceCommandProcessor**: For intent recognition

### Usage:

```dart
// Start listening
VoiceService().startListening(
  language: 'kn-IN',
  onRecognition: (text) {
    print('Recognized: $text');
  },
  onCommandRecognized: (command) {
    print('Command: ${command.intent}');
  },
);

// Speak
VoiceService().speakKannada('ನಮಸ್ಕಾರ');
```

## 📦 Offline Support

The app uses **Hive** for local storage and **OfflineSyncService** for:

- Storing data locally when offline
- Auto-syncing when online
- Conflict resolution
- Queue management

### Offline-First Architecture:

1. **Read**: Try local storage first, then fetch from API
2. **Write**: Save to local storage immediately, sync to API when online
3. **Delete**: Mark as deleted locally, sync deletion to API when online
4. **Sync**: Automatic sync when network becomes available

## 📊 State Management

Uses **Provider** and **Riverpod** for state management:

```dart
// Access state
final authProvider = Provider.of<AuthProvider>(context);

// Listen to changes
Consumer<AuthProvider>(builder: (context, auth, child) {
  if (auth.isAuthenticated) {
    return HomeScreen();
  }
  return LoginScreen();
}),
```

## 🌐 API Service

Centralized API client in `lib/services/api_service.dart`:

```dart
// GET request
final response = await ApiService().get('/products');

// POST request
final response = await ApiService().post('/products', data: product);

// Upload file
final response = await ApiService().uploadFile('/upload', file);
```

## 📍 Location Service

GPS and route management in `lib/services/location_service.dart`:

```dart
// Get current position
final position = await LocationService().getCurrentPosition();

// Start tracking
LocationService().startTracking(
  interval: Duration(seconds: 5),
  onLocationUpdate: (position) {
    print('New position: $position');
  },
);

// Start route tracking
LocationService().startRouteTracking(route);
```

## 🤖 AI Integration

The app integrates with AI services for:

1. **Demand Prediction** - `/api/analytics/demand`
2. **Route Optimization** - `/api/routes/optimize`
3. **Voice Recognition** - `/api/voice/recognize`
4. **Text-to-Speech** - `/api/voice/synthesize`

## 📱 Running the App

### Development

```bash
# Get dependencies
flutter pub get

# Run on device
flutter run

# Run on specific device
flutter run -d <device_id>

# Build APK
flutter build apk --release

# Build App Bundle
flutter build appbundle --release
```

### Production

```bash
# Build for release
flutter build apk --release --split-per-abi

# Or build app bundle
flutter build appbundle --release
```

## 🐛 Debugging

### Common Issues

1. **No Internet Connection**: App works offline, syncs when online
2. **GPS Not Available**: Shows error, requests permission
3. **Voice Recognition Failed**: Falls back to manual input
4. **API Errors**: Shows user-friendly error messages

### Debug Mode

Enable debug logging:

```dart
// In main.dart
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Enable debug mode
  ApiService().initialize();
  
  runApp(MyApp());
}
```

## 📝 Environment Variables

Create `.env` file in the project root:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api/v1
AI_API_BASE_URL=http://localhost:5000/api/v1

# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_PROJECT_ID=vendorsaathi

# Google Maps
GOOGLE_MAPS_API_KEY=your_api_key

# Payment Gateway
RAZORPAY_KEY=your_key
RAZORPAY_SECRET=your_secret

# Weather API
WEATHER_API_KEY=your_key
```

## 🧪 Testing

### Unit Tests

```bash
flutter test test/unit/
```

### Widget Tests

```bash
flutter test test/widget/
```

### Integration Tests

```bash
flutter test test/integration/
```

## 📚 Documentation

- [API Documentation](../docs/API_DOCS.md)
- [Database Schema](../docs/DATABASE_SCHEMA.md)
- [Setup Guide](../docs/SETUP_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📜 License

MIT License - Feel free to use and modify for your projects!

---

**Made with ❤️ for Indian Vendors**
