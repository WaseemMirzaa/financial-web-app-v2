import '../models/notification_model.dart';
import '../models/user_model.dart';

/// Maps a notification to a web app path (short URLs: /chat, /loans, /announcements).
/// Order: announcements → loans → chat → role-specific assignment → home.
String notificationWebPath(NotificationModel n, UserModel user) {
  final titleLower = n.title.toLowerCase();
  final msgLower = n.message.toLowerCase();
  final combined = '$titleLower $msgLower';
  final arCombined = '${n.title} ${n.message}';

  // Announcements / broadcasts
  if (combined.contains('announcement') ||
      combined.contains('broadcast') ||
      arCombined.contains('إعلان')) {
    return '/announcements';
  }

  // Loans (before assignment keywords that may mention "customer")
  if (combined.contains('loan') || arCombined.contains('قرض')) {
    return '/loans';
  }

  // Chat / messages
  if (combined.contains('message') ||
      combined.contains('chat') ||
      arCombined.contains('رسالة') ||
      arCombined.contains('محادثة')) {
    return '/chat';
  }

  // Employee: customer assignment
  if (user.role == UserRole.employee &&
      (combined.contains('customer assigned') || arCombined.contains('عميل'))) {
    return '/employee/customers';
  }

  // Customer: employee assignment
  if (user.role == UserRole.customer &&
      (combined.contains('employee assigned') || arCombined.contains('موظف'))) {
    return '/customer';
  }

  return user.homePath;
}
