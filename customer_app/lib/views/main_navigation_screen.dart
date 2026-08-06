import 'package:flutter/material.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_colors.dart';
import 'store_selection_screen.dart';
import 'product_listings_screen.dart';
import 'account_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  final CartProvider provider;
  final AuthProvider authProvider;

  const MainNavigationScreen({
    super.key,
    required this.provider,
    required this.authProvider,
  });

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  void _navigateToTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([widget.provider, widget.authProvider]),
      builder: (context, _) {
        return Scaffold(
          body: IndexedStack(
            index: _currentIndex,
            children: [
              StoreSelectionScreen(
                provider: widget.provider,
                onNavigateToCatalog: () => _navigateToTab(1),
              ),
              ProductListingsScreen(
                provider: widget.provider,
                authProvider: widget.authProvider,
              ),
              AccountScreen(
                provider: widget.provider,
                authProvider: widget.authProvider,
              ),
            ],
          ),
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: _navigateToTab,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: AppColors.onSurfaceVariant,
            type: BottomNavigationBarType.fixed,
            items: const [
              BottomNavigationBarItem(
                icon: Icon(Icons.storefront_rounded),
                activeIcon: Icon(Icons.storefront_rounded, color: AppColors.primary),
                label: 'Stores',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.grid_view_rounded),
                activeIcon: Icon(Icons.grid_view_rounded, color: AppColors.primary),
                label: 'Catalog',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person_outline_rounded),
                activeIcon: Icon(Icons.person_rounded, color: AppColors.primary),
                label: 'Account',
              ),
            ],
          ),
        );
      },
    );
  }
}
