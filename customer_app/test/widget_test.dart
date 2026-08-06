import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:customer_app_ordering/main.dart';

void main() {
  testWidgets('SolarisGroceryApp renders main navigation', (WidgetTester tester) async {
    TestWidgetsFlutterBinding.ensureInitialized();
    try {
      await Supabase.initialize(
        url: 'https://placeholder.supabase.co',
        publishableKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder',
      );
    } catch (_) {}

    await tester.pumpWidget(const SolarisGroceryApp());
    expect(find.byType(SolarisGroceryApp), findsOneWidget);
  });
}
