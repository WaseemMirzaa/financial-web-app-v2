import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

import '../firebase_options.dart';
import 'api_service.dart';
import 'notification_refresh_trigger.dart';
import 'session_service.dart';

/// Background isolate — show tray notification for data-only FCM when app is not in foreground.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await PushNotificationService.showLocalNotificationForMessage(message);
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

  static final Int64List _vibrationPattern =
      Int64List.fromList([0, 400, 200, 400]);

  static final AndroidNotificationChannel _androidChannel =
      AndroidNotificationChannel(
    'high_importance_channel',
    'Notifications',
    description: 'In-app and push notifications',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    vibrationPattern: _vibrationPattern,
  );

  static AndroidNotificationDetails get _androidNotificationDetails =>
      AndroidNotificationDetails(
        _androidChannel.id,
        _androidChannel.name,
        channelDescription: _androidChannel.description,
        importance: Importance.max,
        priority: Priority.high,
        icon: '@drawable/ic_notification',
        largeIcon: DrawableResourceAndroidBitmap('@mipmap/ic_launcher'),
        playSound: true,
        enableVibration: true,
        vibrationPattern: _vibrationPattern,
        ticker: 'Notification',
        visibility: NotificationVisibility.public,
        audioAttributesUsage: AudioAttributesUsage.notification,
      );

  static Future<void> init() async {
    await _ensureNotificationPermissionOnLaunch();

    const androidInit = AndroidInitializationSettings('@drawable/ic_notification');
    const iosInit = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );
    await _local.initialize(
      const InitializationSettings(android: androidInit, iOS: iosInit),
    );

    final androidPlugin = _local.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    // Recreate channel so sound/vibration settings apply (Android caches channel config).
    await androidPlugin?.deleteNotificationChannel(_androidChannel.id);
    await androidPlugin?.createNotificationChannel(_androidChannel);

    // Foreground: system tray is handled by flutter_local_notifications in onMessage.
    await FirebaseMessaging.instance
        .setForegroundNotificationPresentationOptions(
      alert: true,
      badge: true,
      sound: true,
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
      debugPrint('[FCM] Token refreshed (full): $token');
      final user = await SessionService.getUser();
      if (user != null) {
        await ApiService.registerFcmToken(user.id, token);
      }
    });

    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && token.isNotEmpty) {
        _lastToken = token;
        debugPrint('[FCM] Cached token on init (full): $token');
        final user = await SessionService.getUser();
        if (user != null) {
          await ApiService.registerFcmToken(user.id, token);
        }
      }
    } catch (e) {
      debugPrint('[FCM] getToken on init failed: $e');
    }

    try {
      await FirebaseAnalytics.instance.logAppOpen();
    } catch (_) {}
  }

  static String? _lastToken;

  /// Call after login / session restore so the backend can send pushes.
  static Future<void> registerFcmTokenWithBackend(String userId) async {
    if (userId.isEmpty) return;

    for (var attempt = 0; attempt < 5; attempt++) {
      if (attempt > 0) {
        await Future<void>.delayed(Duration(milliseconds: 400 * attempt));
      }
      try {
        String? token = _lastToken;
        if (token == null || token.isEmpty) {
          token = await FirebaseMessaging.instance.getToken();
        }
        if (token == null || token.isEmpty) {
          debugPrint('[FCM] No device token yet (attempt ${attempt + 1}/5)');
          continue;
        }
        _lastToken = token;
        debugPrint('[FCM] Registering token with backend (full): $token');
        final res = await ApiService.registerFcmToken(userId, token);
        if (res['success'] == true) {
          debugPrint('[FCM] Backend register OK for user $userId');
          return;
        }
        debugPrint('[FCM] Backend register failed: $res');
      } catch (e, st) {
        debugPrint('[FCM] registerFcmTokenWithBackend error (attempt ${attempt + 1}): $e\n$st');
      }
    }
    debugPrint('[FCM] Failed to register token after retries for user $userId');
  }

  /// Prompts for notification permission on launch when not already granted.
  static Future<void> _ensureNotificationPermissionOnLaunch() async {
    if (defaultTargetPlatform == TargetPlatform.android) {
      var status = await Permission.notification.status;
      if (!status.isGranted) {
        if (status.isPermanentlyDenied) {
          await openAppSettings();
        } else {
          await Permission.notification.request();
        }
      }
    }

    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint('[FCM] Permission: ${settings.authorizationStatus}');

    if (defaultTargetPlatform == TargetPlatform.iOS) {
      final auth = settings.authorizationStatus;
      if (auth == AuthorizationStatus.denied) {
        await openAppSettings();
      }
    }
  }

  static Future<void> _onForegroundMessage(RemoteMessage message) async {
    debugPrint(
      '[FCM] Foreground message: ${_pickPushTitle(message)} / ${_pickPushBody(message)}',
    );
    NotificationRefreshTrigger.instance.trigger();
    await showLocalNotificationForMessage(message, plugin: _local);
  }

  /// Shows a local notification (foreground + background data-only messages).
  static Future<void> showLocalNotificationForMessage(
    RemoteMessage message, {
    FlutterLocalNotificationsPlugin? plugin,
  }) async {
    final local = plugin ?? _local;
    final notification = message.notification;
    final title = _pickPushTitle(message);
    final body = _pickPushBody(message);
    if (title.isEmpty && body.isEmpty) return;

    if (plugin != null) {
      const androidInit = AndroidInitializationSettings('@drawable/ic_notification');
      await local.initialize(
        const InitializationSettings(android: androidInit),
      );
      final androidPlugin = local.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>();
      await androidPlugin?.deleteNotificationChannel(_androidChannel.id);
      await androidPlugin?.createNotificationChannel(_androidChannel);
    }

    await local.show(
      Object.hash(title, body, message.sentTime?.millisecondsSinceEpoch ?? 0),
      title.isNotEmpty ? title : (notification?.title ?? 'Notification'),
      body.isNotEmpty ? body : (notification?.body ?? ''),
      NotificationDetails(
        android: _androidNotificationDetails,
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
          interruptionLevel: InterruptionLevel.active,
        ),
      ),
      payload: message.data.isNotEmpty ? message.data.toString() : null,
    );
  }
}
