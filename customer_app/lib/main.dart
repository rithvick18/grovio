import 'package:flutter/material.dart';
import 'providers/cart_provider.dart';
import 'providers/auth_provider.dart';
import 'services/supabase_service.dart';
import 'theme/app_theme.dart';
import 'views/main_navigation_screen.dart';
import 'views/login_screen.dart';
import 'views/onboarding_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await SupabaseService.initialize();
  } catch (e) {
    debugPrint('[main] SupabaseService.initialize error: $e');
  }
  runApp(const GrovioOrderApp());
}

class GrovioOrderApp extends StatefulWidget {
  const GrovioOrderApp({super.key});

  @override
  State<GrovioOrderApp> createState() => _GrovioOrderAppState();
}

class _GrovioOrderAppState extends State<GrovioOrderApp> {
  late final CartProvider _cartProvider;
  late final AuthProvider _authProvider;

  @override
  void initState() {
    super.initState();
    _cartProvider = CartProvider();
    _authProvider = AuthProvider();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _cartProvider.fetchStores();
    });
  }

  @override
  void dispose() {
    _cartProvider.dispose();
    _authProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Grovio Order',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: AuthGate(
        authProvider: _authProvider,
        cartProvider: _cartProvider,
      ),
    );
  }
}

class AuthGate extends StatelessWidget {
  final AuthProvider authProvider;
  final CartProvider cartProvider;

  const AuthGate({
    super.key,
    required this.authProvider,
    required this.cartProvider,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: authProvider,
      builder: (context, _) {
        if (!authProvider.isAuthenticated) {
          return LoginScreen(
            authProvider: authProvider,
            showSkipButton: false,
          );
        }

        if (!authProvider.isOnboarded) {
          return OnboardingScreen(
            authProvider: authProvider,
            cartProvider: cartProvider,
          );
        }

        return MainNavigationScreen(
          provider: cartProvider,
          authProvider: authProvider,
        );
      },
    );
  }
}
