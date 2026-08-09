import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:grovio_order/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Place an order successfully', (WidgetTester tester) async {
    // Start the app
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3)); // Wait for app initialization and splash

    // Tap "Quick Demo Access" to login
    final loginButton = find.text('Quick Demo Access');
    expect(loginButton, findsOneWidget);
    await tester.tap(loginButton);
    await tester.pumpAndSettle(const Duration(seconds: 5)); // Wait for login and routing

    // Might be an onboarding screen if the demo user isn't fully set up, skip it if visible
    final skipButton = find.text('Skip for now');
    if (skipButton.evaluate().isNotEmpty) {
       await tester.tap(skipButton);
       await tester.pumpAndSettle();
    }

    // We should be on MainNavigationScreen which starts at StoreSelectionScreen
    final storeCard = find.byType(Card).first;
    expect(storeCard, findsWidgets); // Should find some stores
    await tester.tap(storeCard);
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Now we are on ProductListingsScreen
    // Wait for products to load
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Find the first Add to cart button
    final addButton = find.widgetWithText(ElevatedButton, 'Add').first;
    expect(addButton, findsOneWidget);

    await tester.tap(addButton);
    await tester.pumpAndSettle();

    // Verify quantity changed to 1
    expect(find.text('1'), findsWidgets);

    // Tap cart icon in the app bar to go to cart
    final cartIcon = find.byIcon(Icons.shopping_cart_outlined);
    expect(cartIcon, findsOneWidget);
    await tester.tap(cartIcon);
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Tap Proceed to Checkout
    final checkoutBtn = find.textContaining('Proceed to Checkout');
    expect(checkoutBtn, findsOneWidget);
    await tester.tap(checkoutBtn);
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Tap Place Order
    final placeOrderBtn = find.textContaining('Place Order');
    expect(placeOrderBtn, findsOneWidget);
    await tester.tap(placeOrderBtn);
    await tester.pumpAndSettle(const Duration(seconds: 5));

    // Order Success Dialog should appear
    expect(find.text('Order Placed!'), findsOneWidget);
  });
}
