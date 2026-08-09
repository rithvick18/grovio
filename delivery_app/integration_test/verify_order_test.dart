import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:grovio_deliver/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Verify order appears in Delivery App', (WidgetTester tester) async {
    // Start the app
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 3)); // Wait for app initialization and splash

    // Tap "Quick Demo Access" to login as shopper
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

    // We should be on MainNavigationScreen which contains OrdersFeedScreen
    // Check if the toggle bar exists
    final offlineText = find.text('You are currently Offline');
    if (offlineText.evaluate().isNotEmpty) {
      // Toggle online
      final toggleButton = find.byType(Switch).first;
      await tester.tap(toggleButton);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    }

    // Now we should see available orders.
    // At least one order should be listed because we just placed one in the previous test.
    // The previous test places an order with status "pending". The backend/delivery app should load it.

    // Wait for the feed to refresh
    await tester.pumpAndSettle(const Duration(seconds: 3));

    // Check if there are orders available. We look for 'Order Manifest' or something in the card.
    // DeliveryOrderCard isn't exported directly, but we can look for specific strings or buttons.
    final acceptButton = find.widgetWithText(ElevatedButton, 'Accept Order').first;
    expect(acceptButton, findsOneWidget, reason: 'Expected to find at least one pending order to accept');

    // Tap accept order to verify it works
    await tester.tap(acceptButton);
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // Verify it switched to the Active Trip tab
    expect(find.text('Active Delivery Trip'), findsWidgets);
  });
}
