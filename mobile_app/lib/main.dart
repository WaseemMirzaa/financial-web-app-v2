import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/locale_provider.dart';
import 'providers/notifications_provider.dart';
import 'providers/settings_provider.dart';
import 'screens/splash_screen.dart';
import 'services/push_notification_service.dart';
import 'firebase_options.dart';
import 'theme/app_theme.dart';
import 'l10n/mobile_strings.dart';
import 'widgets/connectivity_wrapper.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(AppTheme.lightStatusBarOnPrimary);
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
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
              title: mobileAppTitle(locale.locale),
              theme: AppTheme.light,
              locale: Locale(locale.locale),
              builder: (context, child) {
                return AnnotatedRegion<SystemUiOverlayStyle>(
                  value: AppTheme.lightStatusBarOnPrimary,
                  child: child ?? const SizedBox.shrink(),
                );
              },
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
