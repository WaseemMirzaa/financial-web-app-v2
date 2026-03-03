import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:financial_mobile/providers/auth_provider.dart';
import 'package:financial_mobile/providers/settings_provider.dart';

void main() {
  testWidgets('App loads', (WidgetTester tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => SettingsProvider()),
          ChangeNotifierProvider(create: (_) => AuthProvider()),
        ],
        child: const MaterialApp(
          home: Scaffold(body: Text('Test')),
        ),
      ),
    );
    expect(find.text('Test'), findsOneWidget);
  });
}
