import 'package:flutter/material.dart';

class AppConstants {
  // App Info
  static const String appName = 'VendorSaathi';
  static const String appDescription = 'AI-Driven Voice Commerce & Intelligent Mobility Platform for Vendors';
  static const String appVersion = '1.0.0';
  static const String buildNumber = '1';
  
  // API Configuration
  static const String apiBaseUrl = 'http://10.0.2.2:3000/api/v1';
  // For production, use: https://api.vendorsaathi.com/api/v1
  static const int apiTimeout = 30;
  static const int apiRetryCount = 3;
  
  // Firebase Configuration
  static const String firebaseProjectId = 'vendorsaathi';
  static const String firebaseApiKey = 'YOUR_FIREBASE_API_KEY';
  static const String firebaseAuthDomain = 'vendorsaathi.firebaseapp.com';
  
  // Google Maps Configuration
  static const String googleMapsApiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
  
  // Payment Gateway Configuration
  static const String razorpayKey = 'YOUR_RAZORPAY_KEY';
  static const String razorpaySecret = 'YOUR_RAZORPAY_SECRET';
  
  // Weather API Configuration
  static const String weatherApiKey = 'YOUR_WEATHER_API_KEY';
  static const String weatherApiBaseUrl = 'https://api.openweathermap.org/data/2.5';
  
  // AI/ML API Configuration
  static const String aiApiBaseUrl = 'http://10.0.2.2:5000/api/v1';
  // For production, use: https://ai.vendorsaathi.com/api/v1
  
  // Storage Box Names
  static const String kProductsBox = 'products';
  static const String kOrdersBox = 'orders';
  static const String kPaymentsBox = 'payments';
  static const String kUdhaarBox = 'udhaar';
  static const String kCustomersBox = 'customers';
  static const String kRoutesBox = 'routes';
  static const String kSettingsBox = 'settings';
  static const String kUserBox = 'user';
  
  // Shared Preferences Keys
  static const String kAuthToken = 'auth_token';
  static const String kRefreshToken = 'refresh_token';
  static const String kUserId = 'user_id';
  static const String kUserData = 'user_data';
  static const String kIsLoggedIn = 'is_logged_in';
  static const String kIsOnboarded = 'is_onboarded';
  static const String kLanguage = 'language';
  static const String kTheme = 'theme';
  static const String kVoiceEnabled = 'voice_enabled';
  static const String kLocationEnabled = 'location_enabled';
  static const String kNotificationsEnabled = 'notifications_enabled';
  static const String kDeviceToken = 'device_token';
  static const String kLastSyncTime = 'last_sync_time';
  
  // Default Values
  static const String defaultLanguage = 'en';
  static const String defaultKannadaLanguage = 'kn';
  static const String defaultTheme = 'light';
  static const bool defaultVoiceEnabled = true;
  static const bool defaultLocationEnabled = true;
  static const bool defaultNotificationsEnabled = true;
  
  // Validation Rules
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 32;
  static const int minPhoneLength = 10;
  static const int maxPhoneLength = 15;
  static const int minNameLength = 2;
  static const int maxNameLength = 100;
  static const int maxDescriptionLength = 1000;
  
  // Pagination
  static const int itemsPerPage = 20;
  static const int maxItemsPerPage = 100;
  
  // Cache Settings
  static const Duration cacheDuration = Duration(minutes: 15);
  static const int maxCacheSize = 100;
  
  // Sync Settings
  static const Duration autoSyncInterval = Duration(minutes: 5);
  static const int maxSyncRetries = 3;
  static const Duration syncTimeout = Duration(seconds: 30);
  
  // Location Settings
  static const double defaultLocationAccuracy = 10.0; // meters
  static const Duration locationUpdateInterval = Duration(seconds: 5);
  static const double locationUpdateDistance = 10.0; // meters
  
  // Map Settings
  static const double defaultZoom = 14.0;
  static const double minZoom = 2.0;
  static const double maxZoom = 20.0;
  static const LatLng defaultLocation = LatLng(12.8677, 74.8456); // Mangalore, Karnataka
  
  // Voice Settings
  static const double defaultSpeechRate = 1.0;
  static const double defaultSpeechPitch = 1.0;
  static const Duration voiceRecognitionTimeout = Duration(seconds: 10);
  static const int maxVoiceCommandLength = 100;
  
  // Image Settings
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const List<String> allowedImageExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  static const int maxImageDimensions = 2000; // pixels
  static const int thumbnailWidth = 300;
  static const int thumbnailHeight = 300;
  
  // File Settings
  static const int maxFileSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedFileExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
  
  // Currency
  static const String defaultCurrency = 'INR';
  static const String currencySymbol = '₹';
  static const int decimalPlaces = 2;
  
  // Date Formats
  static const String dateFormat = 'yyyy-MM-dd';
  static const String dateTimeFormat = 'yyyy-MM-dd HH:mm:ss';
  static const String displayDateFormat = 'dd MMM yyyy';
  static const String displayDateTimeFormat = 'dd MMM yyyy, hh:mm a';
  static const String timeFormat = 'hh:mm a';
  static const String kannadaDateFormat = 'dd-MMM-yyyy';
  
  // Time Zones
  static const String timeZone = 'Asia/Kolkata';
  static const String timeZoneOffset = '+05:30';
  
  // Business Hours
  static const String defaultOpeningTime = '08:00';
  static const String defaultClosingTime = '20:00';
  
  // Delivery Settings
  static const double defaultDeliveryRadius = 10.0; // km
  static const double defaultDeliveryCharge = 50.0; // INR
  static const double minOrderAmount = 100.0; // INR
  
  // Loyalty Settings
  static const double loyaltyPointsPerRupee = 1.0;
  static const int pointsForRupee = 1;
  static const int rupeesPerPoint = 1;
  static const int minPointsForRedemption = 100;
  static const double redemptionRate = 1.0; // 1 point = 1 rupee
  
  // Udhaar Settings
  static const double defaultInterestRate = 0.0; // 0% per month
  static const int defaultUdhaarLimit = 1000; // INR
  static const int udhaarDueDays = 30; // days
  
  // Notification Settings
  static const int maxNotifications = 50;
  static const Duration notificationExpiry = Duration(days: 30);
  
  // Rate Limiting
  static const int maxApiRequestsPerMinute = 60;
  static const int maxApiRequestsPerHour = 1000;
  
  // Error Messages
  static const String errorNoInternet = 'No internet connection. Please check your network.';
  static const String errorServer = 'Server error. Please try again later.';
  static const String errorUnauthorized = 'Unauthorized. Please login again.';
  static const String errorNotFound = 'Not found.';
  static const String errorValidation = 'Validation error. Please check your input.';
  static const String errorGeneric = 'An error occurred. Please try again.';
  
  // Success Messages
  static const String successCreated = 'Created successfully';
  static const String successUpdated = 'Updated successfully';
  static const String successDeleted = 'Deleted successfully';
  static const String successSaved = 'Saved successfully';
  static const String successSynced = 'Synced successfully';
  
  // Warning Messages
  static const String warningNoData = 'No data available';
  static const String warningOffline = 'You are offline. Changes will sync when online.';
  static const String warningLowStock = 'Low stock alert';
  static const String warningOverdue = 'Payment overdue';
  
  // Confirmation Messages
  static const String confirmDelete = 'Are you sure you want to delete this?';
  static const String confirmLogout = 'Are you sure you want to logout?';
  static const String confirmClear = 'Are you sure you want to clear all data?';
  
  // Kannada Messages
  static const Map<String, String> kannadaMessages = {
    'welcome': 'ಸ್ವಾಗತ',
    'hello': 'ನಮಸ್ಕಾರ',
    'good_morning': 'ಶುಭೋದಯ',
    'good_afternoon': 'ಶುಭ ಅಪರಾಹ್ನ',
    'good_evening': 'ಶುಭ ಸಾಯಂಕಾಲ',
    'good_night': 'ಶುಭ ರಾತ್ರಿ',
    'thank_you': 'ಧನ್ಯವಾದಗಳು',
    'please_wait': 'ದಯವಿಟ್ಟು ಕಾಯಿರಿ',
    'loading': 'ಲೋಡಿಂಗ್...',
    'success': 'ಯಶಸ್ವಿ',
    'error': 'ದೋಷ',
    'warning': 'ಎಚ್ಚರಿಕೆ',
    'no_data': 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ',
    'no_internet': 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವಿಲ್ಲ',
    'try_again': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    'saved': 'ಉಳಿಸಲಾಗಿದೆ',
    'updated': 'ಅಪ್ಡೇಟ್ ಮಾಡಲಾಗಿದೆ',
    'deleted': 'ಅಳಿಸಲಾಗಿದೆ',
    'created': 'ಸೃಷ್ಟಿಸಲಾಗಿದೆ',
    'syncing': 'ಸಿಂಕ್ ಮಾಡುತ್ತಿದೆ...',
    'synced': 'ಸಿಂಕ್ ಮಾಡಲಾಗಿದೆ',
    'offline': 'ಆಫ್ಲೈನ್',
    'online': 'ಆನ್ಲೈನ್',
    'total': 'ಮೊತ್ತ',
    'amount': 'ಮೊತ್ತ',
    'quantity': 'ಪರಿಮಾಣ',
    'price': 'ಬೆಲೆ',
    'order': 'ಆರ್ಡರ್',
    'product': 'ಉತ್ಪನ್ನ',
    'customer': 'ಗ್ರಾಹಕ',
    'payment': 'ಪಾವತಿ',
    'udhaar': 'ಉಧಾರ್',
    'route': 'ಮಾರ್ಗ',
    'sales': 'ಮಾರಾಟ',
    'profit': 'ಲಾಭ',
    'loss': 'ನಷ್ಟ',
    'dashboard': 'ಡ್ಯಾಶ್ಬೋರ್ಡ್',
    'settings': 'ಸೆಟ್ಟಿಂಗ್ಸ್',
    'profile': 'ಪ್ರೊಫೈಲ್',
    'logout': 'ಲಾಗ್ ಔಟ್',
    'login': 'ಲಾಗಿನ್',
    'register': 'ನೋಂದಣಿ',
    'help': 'ಸಹಾಯ',
    'home': 'ಮುಖಪುಟ',
    'back': 'ಹಿಂತಿರುಗಿ',
    'next': 'ಮುಂದೆ',
    'previous': 'ಹಿಂದಿನ',
    'search': 'ಹುಡುಕಿ',
    'filter': 'ಫಿಲ್ಟರ್',
    'sort': 'ವರ್ಗೀಕರಿಸಿ',
    'refresh': 'ರಿಫ್ರೆಶ್',
    'export': 'ರಫ್ತು ಮಾಡಿ',
    'print': 'ಮುದ್ರಿಸಿ',
    'share': 'ಹಂಚಿಕೊಳ್ಳಿ',
    'call': 'ಕರೆ ಮಾಡಿ',
    'message': 'ಸಂದೇಶ',
    'today': 'ಇಂದು',
    'yesterday': 'ನೆಳದಿನ',
    'this_week': 'ಈ ವಾರ',
    'last_week': 'ಕಳೆದ ವಾರ',
    'this_month': 'ಈ ತಿಂಗಳು',
    'last_month': 'ಕಳೆದ ತಿಂಗಳು',
    'all_time': 'ಎಲ್ಲಾ ಸಮಯ',
  };
  
  // Kannada Voice Commands
  static const Map<String, String> kannadaVoiceCommands = {
    'show_products': 'ನನ್ನ ಉತ್ಪನ್ನಗಳನ್ನು ತೋರಿಸಿ',
    'create_product': 'ಹೊಸ ಉತ್ಪನ್ನ ಸೃಷ್ಟಿಸಿ',
    'delete_product': 'ಉತ್ಪನ್ನ ಅಳಿಸಿ',
    'show_orders': 'ಆರ್ಡರ್ ಪಟ್ಟಿ ತೋರಿಸಿ',
    'create_order': 'ಹೊಸ ಆರ್ಡರ್ ಸೃಷ್ಟಿಸಿ',
    'show_sales': 'ಮಾರಾಟ ವರದಿ ತೋರಿಸಿ',
    'today_sales': 'ಇಂದಿನ ಮಾರಾಟ ವರದಿ',
    'optimize_route': 'ರೂಟ್ ಆಪ್ಟಿಮೈಜ್ ಮಾಡಿ',
    'show_location': 'ನನ್ನ ಸ್ಥಳ ತೋರಿಸಿ',
    'make_payment': 'ಹಣ ಪಾವತಿ ಮಾಡಿ',
    'show_udhaar': 'ಉಧಾರ್ ಮಾಹಿತಿ ತೋರಿಸಿ',
    'show_weather': 'ಹವಾಮಾನ ಮಾಹಿತಿ ತೋರಿಸಿ',
    'show_details': 'ವಿವರಗಳನ್ನು ತೋರಿಸಿ',
    'go_back': 'ಹಿಂತಿರುಗಿ',
    'go_home': 'ಮುಖಪುಟ',
    'open_settings': 'ಸೆಟ್ಟಿಂಗ್‍ಗಳನ್ನು ತೆರೆದಿರಿ',
    'help': 'ಸಹಾಯ',
  };
  
  // App Routes
  static const String routeSplash = '/';
  static const String routeLogin = '/login';
  static const String routeRegister = '/register';
  static const String routeForgotPassword = '/forgot-password';
  static const String routeVerifyOtp = '/verify-otp';
  static const String routeOnboarding = '/onboarding';
  static const String routeHome = '/home';
  static const String routeDashboard = '/dashboard';
  static const String routeProducts = '/products';
  static const String routeAddProduct = '/products/add';
  static const String routeEditProduct = '/products/edit';
  static const String routeOrders = '/orders';
  static const String routeCreateOrder = '/orders/create';
  static const String routeOrderDetail = '/orders/:id';
  static const String routeCustomers = '/customers';
  static const String routeCustomerDetail = '/customers/:id';
  static const String routeInventory = '/inventory';
  static const String routePayments = '/payments';
  static const String routeUdhaar = '/udhaar';
  static const String routeRoutes = '/routes';
  static const String routeRouteDetail = '/routes/:id';
  static const String routeAnalytics = '/analytics';
  static const String routeVoice = '/voice';
  static const String routeSettings = '/settings';
  static const String routeProfile = '/profile';
  static const String routeWeather = '/weather';
  static const String routeLoyalty = '/loyalty';
  static const String routeNotifications = '/notifications';
  
  // Asset Paths
  static const String assetsImages = 'assets/images';
  static const String assetsIcons = 'assets/icons';
  static const String assetsFonts = 'assets/fonts';
  static const String assetsAnimations = 'assets/animations';
  static const String assetsVoice = 'assets/voice';
  
  // Image Assets
  static const String logo = '$assetsImages/logo.png';
  static const String appIcon = '$assetsImages/app_icon.png';
  static const String splashScreen = '$assetsImages/splash_screen.png';
  static const String placeholderImage = '$assetsImages/placeholder.png';
  static const String noDataImage = '$assetsImages/no_data.png';
  static const String errorImage = '$assetsImages/error.png';
  static const String successImage = '$assetsImages/success.png';
  
  // Icon Assets
  static const String iconProducts = '$assetsIcons/products.png';
  static const String iconOrders = '$assetsIcons/orders.png';
  static const String iconCustomers = '$assetsIcons/customers.png';
  static const String iconPayments = '$assetsIcons/payments.png';
  static const String iconUdhaar = '$assetsIcons/udhaar.png';
  static const String iconRoutes = '$assetsIcons/routes.png';
  static const String iconAnalytics = '$assetsIcons/analytics.png';
  static const String iconSettings = '$assetsIcons/settings.png';
  static const String iconProfile = '$assetsIcons/profile.png';
  static const String iconDashboard = '$assetsIcons/dashboard.png';
  static const String iconVoice = '$assetsIcons/voice.png';
  static const String iconWeather = '$assetsIcons/weather.png';
  static const String iconLoyalty = '$assetsIcons/loyalty.png';
  
  // Animation Assets
  static const String loadingAnimation = '$assetsAnimations/loading.json';
  static const String successAnimation = '$assetsAnimations/success.json';
  static const String errorAnimation = '$assetsAnimations/error.json';
  static const String emptyAnimation = '$assetsAnimations/empty.json';
  
  // Font Assets
  static const String fontPoppinsRegular = '$assetsFonts/Poppins-Regular.ttf';
  static const String fontPoppinsMedium = '$assetsFonts/Poppins-Medium.ttf';
  static const String fontPoppinsSemiBold = '$assetsFonts/Poppins-SemiBold.ttf';
  static const String fontPoppinsBold = '$assetsFonts/Poppins-Bold.ttf';
  static const String fontNotoSansKannadaRegular = '$assetsFonts/NotoSansKannada-Regular.ttf';
  static const String fontNotoSansKannadaMedium = '$assetsFonts/NotoSansKannada-Medium.ttf';
  static const String fontNotoSansKannadaBold = '$assetsFonts/NotoSansKannada-Bold.ttf';
  
  // API Endpoints
  static const String apiAuthLogin = '/auth/login';
  static const String apiAuthRegister = '/auth/register';
  static const String apiAuthRefresh = '/auth/refresh';
  static const String apiAuthLogout = '/auth/logout';
  static const String apiAuthForgotPassword = '/auth/forgot-password';
  static const String apiAuthVerifyOtp = '/auth/verify-otp';
  static const String apiAuthResetPassword = '/auth/reset-password';
  
  static const String apiUsers = '/users';
  static const String apiUsersMe = '/users/me';
  static const String apiUsersProfile = '/users/profile';
  
  static const String apiProducts = '/products';
  static const String apiProductsSearch = '/products/search';
  static const String apiProductsCategories = '/products/categories';
  static const String apiProductsBarcode = '/products/barcode';
  
  static const String apiOrders = '/orders';
  static const String apiOrdersCreate = '/orders/create';
  static const String apiOrdersStatus = '/orders/status';
  static const String apiOrdersTrack = '/orders/track';
  
  static const String apiCustomers = '/customers';
  static const String apiCustomersSearch = '/customers/search';
  static const String apiCustomersLoyalty = '/customers/loyalty';
  
  static const String apiPayments = '/payments';
  static const String apiPaymentsMethods = '/payments/methods';
  static const String apiPaymentsProcess = '/payments/process';
  static const String apiPaymentsRefund = '/payments/refund';
  
  static const String apiUdhaar = '/udhaar';
  static const String apiUdhaarSummary = '/udhaar/summary';
  static const String apiUdhaarStatement = '/udhaar/statement';
  static const String apiUdhaarPayments = '/udhaar/payments';
  
  static const String apiRoutes = '/routes';
  static const String apiRoutesOptimize = '/routes/optimize';
  static const String apiRoutesCurrent = '/routes/current';
  static const String apiRoutesHistory = '/routes/history';
  
  static const String apiAnalytics = '/analytics';
  static const String apiAnalyticsSales = '/analytics/sales';
  static const String apiAnalyticsRevenue = '/analytics/revenue';
  static const String apiAnalyticsProfit = '/analytics/profit';
  static const String apiAnalyticsProducts = '/analytics/products';
  static const String apiAnalyticsCustomers = '/analytics/customers';
  static const String apiAnalyticsDemand = '/analytics/demand';
  
  static const String apiVoice = '/voice';
  static const String apiVoiceRecognize = '/voice/recognize';
  static const String apiVoiceSynthesize = '/voice/synthesize';
  static const String apiVoiceCommands = '/voice/commands';
  
  static const String apiWeather = '/weather';
  static const String apiWeatherCurrent = '/weather/current';
  static const String apiWeatherForecast = '/weather/forecast';
  
  static const String apiLoyalty = '/loyalty';
  static const String apiLoyaltyPoints = '/loyalty/points';
  static const String apiLoyaltyRedeem = '/loyalty/redeem';
  static const String apiLoyaltyTiers = '/loyalty/tiers';
  
  static const String apiNotifications = '/notifications';
  static const String apiNotificationsMarkRead = '/notifications/mark-read';
  static const String apiNotificationsDelete = '/notifications/delete';
  
  static const String apiSettings = '/settings';
  static const String apiSettingsVoice = '/settings/voice';
  static const String apiSettingsLocation = '/settings/location';
  static const String apiSettingsNotifications = '/settings/notifications';
  
  static const String apiHealth = '/health';
  static const String apiVersion = '/version';
  static const String apiConfig = '/config';
  
  // Demo Data
  static const List<String> demoProductCategories = [
    'Groceries',
    'Vegetables',
    'Fruits',
    'Dairy',
    'Bakery',
    'Snacks',
    'Beverages',
    'Household',
    'Personal Care',
  ];
  
  static const List<String> demoProductNames = [
    'Rice',
    'Wheat',
    'Sugar',
    'Salt',
    'Oil',
    'Tea',
    'Coffee',
    'Milk',
    'Curd',
    'Bread',
    'Eggs',
    'Potatoes',
    'Onions',
    'Tomatoes',
    'Bananas',
    'Apples',
    'Mangoes',
    'Soap',
    'Shampoo',
    'Detergent',
  ];
  
  static const List<String> demoKannadaProductNames = [
    'ಅಕ್ಕಿ',
    'ಗೋಧಿ',
    'ಸಕ್ಕರೆ',
    'ಉಪ್ಪು',
    'ಎಣ್ಣೆ',
    'ಚಹಾ',
    'ಕಾಫಿ',
    'ಹಾಲು',
    'ಮೊಸರು',
    'ಬ್ರೆಡ್',
    'ಮುತ್ತೈ',
    'ಆಲೂಗಡ್ಡೆ',
    'ಈರುಳ್ಳಿ',
    'ಟೊಮ್ಯಾಟೋ',
    'ಬಾಳೆಹಣ್ಣು',
    'ಸೇಬು',
    'ಮಾವು',
    'ಸೋಪು',
    'ಶ್ಯಾಂಪೂ',
    'ಡಿಟರ್ಜೆಂಟ್',
  ];
  
  // Demo Customer Names
  static const List<String> demoCustomerNames = [
    'Rajesh',
    'Suresh',
    'Mahesh',
    'Ramesh',
    'Ganesh',
    'Priya',
    'Anita',
    'Sunita',
    'Reena',
    'Meena',
  ];
  
  // Demo Kannada Customer Names
  static const List<String> demoKannadaCustomerNames = [
    'ರಾಜೇಶ್',
    'ಸುರೇಶ್',
    'ಮಹೇಶ್',
    'ರಮೇಶ್',
    'ಗಣೇಶ್',
    'ಪ್ರಿಯ',
    'ಅನಿತಾ',
    'ಸುನೀತಾ',
    'ರೀಣಾ',
    'ಮೀನಾ',
  ];
}
