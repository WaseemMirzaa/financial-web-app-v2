import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

import '../firebase_options.dart';
import 'api_service.dart';
import 'notification_refresh_trigger.dart';
import 'session_service.dart';

/// Background isolate — must not touch UI or main-isolate singletons.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

/// Arabic script (subset) — matches server [fcm.ts] for EN-only Arabic payloads.
final RegExp _arabicScript = RegExp(
  r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]',
);

String _pickPushTitle(RemoteMessage message) {
  final d = message.data;
  final ar = (d['title_ar']?.toString() ?? '').trim();
  if (ar.isNotEmpty) return ar;
  final en = (d['title_en']?.toString() ?? '').trim();
  if (en.isNotEmpty && _arabicScript.hasMatch(en)) return en;
  final n = message.notification?.title?.trim();
  if (n != null && n.isNotEmpty) return n;
  return en;
}

String _pickPushBody(RemoteMessage message) {
  final d = message.data;
  final ar = (d['body_ar']?.toString() ?? '').trim();
  if (ar.isNotEmpty) return ar;
  final en = (d['body_en']?.toString() ?? '').trim();
  if (en.isNotEmpty && _arabicScript.hasMatch(en)) return en;
  final n = message.notification?.body?.trim();
  if (n != null && n.isNotEmpty) return n;
  return en;
}

/// FCM: permission, token → backend, foreground local notifications, open handlers.
class PushNotificationService {
  static final FlutterLocalNotificationsPlugin _local =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _androidChannel =
      AndroidNotificationChannel(
    'high_importance_channel',
    'Notifications',
    description: 'In-app and push notifications',
    importance: Importance.high,
  );

  static Future<void> init() async {
    await _ensureAndroidPostNotificationPermission();

    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _local.initialize(
      const InitializationSettings(android: androidInit, iOS: iosInit),
    );

    final iosLocal = _local.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();
    await iosLocal?.requestPermissions(alert: true, badge: true, sound: true);

    final androidPlugin = _local.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_androidChannel);

    try {
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
    } catch (_) {}

    await FirebaseMessaging.instance
        .setForegroundNotificationPresentationOptions(
      alert: false,
      badge: false,
      sound: false,
    );

    FirebaseMessaging.onMessage.listen(_onForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen((_) {
      NotificationRefreshTrigger.instance.trigger();
    });
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      NotificationRefreshTrigger.instance.trigger();
    }

    FirebaseMessaging.instance.onTokenRefresh.listen((token) async {
      _lastToken = token;
      final user = await SessionService.getUser();
      if (user != null) {
        await ApiService.registerFcmToken(user.id, token);
      }
    });
  }

  static String? _lastToken;

  /// Call after login / session restore so the backend can send pushes.
  static Future<void> registerFcmTokenWithBackend(String userId) async {
    if (userId.isEmpty) return;
    try {
      final token = _lastToken ?? await FirebaseMessaging.instance.getToken();
      if (token == null || token.isEmpty) return;
      _lastToken = token;
      await ApiService.registerFcmToken(userId, token);
    } catch (_) {}
  }

  static Future<void> _ensureAndroidPostNotificationPermission() async {
    if (defaultTargetPlatform != TargetPlatform.android) return;
    final status = await Permission.notification.status;
    if (status.isDenied) {
      await Permission.notification.request();
    }
  }

  static Future<void> _onForegroundMessage(RemoteMessage message) async {
    NotificationRefreshTrigger.instance.trigger();

    final notification = message.notification;
    final title = _pickPushTitle(message);
    final body = _pickPushBody(message);
    if (title.isEmpty && body.isEmpty) return;

    await _local.show(
      Object.hash(title, body, message.sentTime?.millisecondsSinceEpoch ?? 0),
      title.isNotEmpty ? title : (notification?.title ?? ''),
      body.isNotEmpty ? body : (notification?.body ?? ''),
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: message.data.isNotEmpty ? message.data.toString() : null,
    );
  }
}
