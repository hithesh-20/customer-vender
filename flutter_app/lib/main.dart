import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:vendor_saathi/config/app_router.dart';
import 'package:vendor_saathi/config/theme.dart';
import 'package:vendor_saathi/providers/auth_provider.dart';
import 'package:vendor_saathi/providers/product_provider.dart';
import 'package:vendor_saathi/providers/order_provider.dart';
import 'package:vendor_saathi/providers/voice_provider.dart';
import 'package:vendor_saathi/providers/location_provider.dart';
import 'package:vendor_saathi/providers/connectivity_provider.dart';
import 'package:vendor_saathi/services/offline_sync_service.dart';

// Local storage box names
const String kProductsBox = 'products';
const String kOrdersBox = 'orders';
const String kPaymentsBox = 'payments';
const String kUdhaarBox = 'udhaar';
const String kSettingsBox = 'settings';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize Hive for offline storage
  await Hive.initFlutter();
  await Hive.openBox(kProductsBox);
  await Hive.openBox(kOrdersBox);
  await Hive.openBox(kPaymentsBox);
  await Hive.openBox(kUdhaarBox);
  await Hive.openBox(kSettingsBox);

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize offline sync service
  await OfflineSyncService.instance.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProductProvider()),
        ChangeNotifierProvider(create: (_) => OrderProvider()),
        ChangeNotifierProvider(create: (_) => VoiceProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
      ],
      child: ScreenUtilInit(
        designSize: const Size(375, 812),
        minTextAdapt: true,
        splitScreenMode: true,
        builder: (context, child) {
          return MaterialApp.router(
            title: 'VendorSaathi',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: ThemeMode.system,
            routerConfig: AppRouter.router,
            builder: (context, child) {
              return MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  textScaler: TextScaler.linear(
                    ScreenUtil().textScaleFactor,
                  ),
                ),
                child: child!,
              );
            },
          );
        },
      ),
    );
  }
}
