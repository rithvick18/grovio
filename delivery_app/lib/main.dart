import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/delivery_provider.dart';
import 'services/supabase_service.dart';
import 'theme/app_theme.dart';
import 'views/main_navigation_screen.dart';
import 'views/login_screen.dart';
import 'views/shopper_onboarding_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint('[main] SupabaseService.initialize error: $e');
  }
  runApp(const GrovioDeliverApp());
}

class GrovioDeliverApp extends StatefulWidget {
  const GrovioDeliverApp({super.key});

  @override
  State<GrovioDeliverApp> createState() => _GrovioDeliverAppState();
}

class _GrovioDeliverAppState extends State<GrovioDeliverApp> {
  late final AuthProvider _authProvider;
  late final DeliveryProvider _deliveryProvider;

  @override
  void initState() {
    super.initState();
    _authProvider = AuthProvider();
    _deliveryProvider = DeliveryProvider();
    // Initialize with live data after widget is created
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _deliveryProvider.initialize();
    });
  }

  @override
  void dispose() {
    _authProvider.dispose();
    _deliveryProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _deliveryProvider),
      ],
      child: MaterialApp(
        title: 'Grovio Deliver',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: Consumer<AuthProvider>(
          builder: (context, auth, _) {
            if (auth.isLoading) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }

            if (!auth.isAuthenticated) {
              return LoginScreen(authProvider: auth);
            }

            if (!auth.isOnboarded) {
              return ShopperOnboardingScreen(
                authProvider: auth,
                deliveryProvider: _deliveryProvider,
              );
            }

            return MainNavigationScreen(deliveryProvider: _deliveryProvider);
          },
        ),
      ),
    );
  }
}
