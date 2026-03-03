import 'package:firebase_messaging/firebase_messaging.dart';

import 'notification_refresh_trigger.dart';

/// Initializes FCM and triggers notification list refresh when a push is received or opened.
class PushNotificationService {
  static Future<void> init() async {
    try {
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
    } catch (_) {}

    FirebaseMessaging.onMessage.listen((_) {
      NotificationRefreshTrigger.instance.trigger();
    });
    FirebaseMessaging.onMessageOpenedApp.listen((_) {
      NotificationRefreshTrigger.instance.trigger();
    });
    final initial = await FirebaseMessaging.instance.getInitialMessage();
    if (initial != null) {
      NotificationRefreshTrigger.instance.trigger();
    }
  }
}
