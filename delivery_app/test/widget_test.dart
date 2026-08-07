import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:grovio_deliver/main.dart';

void main() {
  testWidgets('Delivery App Smoke Test', (WidgetTester tester) async {
    TestWidgetsFlutterBinding.ensureInitialized();
    try {
      await Supabase.initialize(
        url: 'https://placeholder.supabase.co',
        publishableKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder',
      );
    } catch (_) {}

    await tester.pumpWidget(const GrovioDeliverApp());
    expect(find.byType(GrovioDeliverApp), findsOneWidget);
  });
}
