import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/connectivity_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  final localeProvider = LocaleProvider();
  await localeProvider.load();
  runApp(FinancialMobileApp(localeProvider: localeProvider));
}

class FinancialMobileApp extends StatelessWidget {
  const FinancialMobileApp({super.key, required this.localeProvider});
  final LocaleProvider localeProvider;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: localeProvider),
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Consumer<LocaleProvider>(
        builder: (_, locale, __) {
          return ConnectivityWrapper(
            child: MaterialApp(
              title: 'الخليج للتمويل',
              theme: AppTheme.light,
              locale: Locale(locale.locale),
              supportedLocales: const [Locale('en'), Locale('ar')],
              home: const SplashScreen(),
            ),
          );
        },
      ),
    );
  }
}
