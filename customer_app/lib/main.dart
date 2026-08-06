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
  await SupabaseService.initialize();
  runApp(const SolarisGroceryApp());
}

class SolarisGroceryApp extends StatefulWidget {
  const SolarisGroceryApp({super.key});

  @override
  State<SolarisGroceryApp> createState() => _SolarisGroceryAppState();
}

class _SolarisGroceryAppState extends State<SolarisGroceryApp> {
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
      title: 'Solaris Gold Grocery',
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
