import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/notifications_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/splash_screen.dart';
import 'services/push_notification_service.dart';
import 'theme/app_theme.dart';
import 'l10n/mobile_strings.dart';
import 'widgets/connectivity_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
      systemNavigationBarDividerColor: Colors.transparent,
    ),
  );
  try {
    await Firebase.initializeApp();
    await PushNotificationService.init();
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
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
      ],
      child: Consumer<LocaleProvider>(
        builder: (_, locale, __) {
          return ConnectivityWrapper(
            child: MaterialApp(
              title: MobileStrings(locale.locale).appName,
              theme: AppTheme.light,
              locale: Locale(locale.locale),
              localizationsDelegates: const [
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              supportedLocales: const [Locale('en'), Locale('ar')],
              home: const SplashScreen(),
            ),
          );
        },
      ),
    );
  }
}
