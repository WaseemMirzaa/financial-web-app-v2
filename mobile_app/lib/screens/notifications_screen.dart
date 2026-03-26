import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/mobile_strings.dart';
import '../models/notification_model.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../providers/notifications_provider.dart';
import '../theme/app_theme.dart';
import '../utils/notification_web_path.dart';
import '../widgets/web_view_tab.dart';
import 'login_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      final locale = context.read<LocaleProvider>();
      final provider = context.read<NotificationsProvider>();
      provider.setLocale(locale.locale);
      if (auth.user != null) {
        provider.setUserId(auth.user!.id);
        provider.load(auth.user!.id);
      }
    });
  }

  Future<void> _onNotificationTap(NotificationModel notification) async {
    final auth = context.read<AuthProvider>();
    final np = context.read<NotificationsProvider>();
    final locale = context.read<LocaleProvider>();
    final user = auth.user;
    if (user == null) return;

    if (!notification.isRead) {
      await np.markAsRead(notification.id);
    }
    if (!mounted) return;

    final path = notificationWebPath(notification, user);
    final t = MobileStrings(locale.locale);

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (ctx) => Scaffold(
          backgroundColor: Colors.white,
          appBar: AppBar(
            title: Text(t.notificationsTitle),
            backgroundColor: AppTheme.primary500,
            foregroundColor: Colors.white,
          ),
          body: WebViewTab(
            path: path,
            userId: user.id,
            userJson: user.toJson(),
            onWebLogout: () {
              auth.logout();
              Navigator.of(ctx).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            },
            onLocaleFromWeb: (l) => locale.setLocale(l),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = MobileStrings(context.watch<LocaleProvider>().locale);
    return Scaffold(
      backgroundColor: AppTheme.bgPage,
      appBar: AppBar(
        title: Text(t.notificationsTitle),
        backgroundColor: AppTheme.primary500,
        foregroundColor: Colors.white,
        actions: [
          Consumer<NotificationsProvider>(
            builder: (_, np, __) {
              if (np.unreadCount == 0) return const SizedBox.shrink();
              return TextButton(
                onPressed: np.loading ? null : () => np.markAllAsRead(),
                child: Text(t.markAllRead),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationsProvider>(
        builder: (_, np, __) {
          if (np.loading && np.list.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          if (np.list.isEmpty) {
            return Center(child: Text(t.noNotifications));
          }
          return RefreshIndicator(
            onRefresh: () {
              final uid = context.read<AuthProvider>().user?.id;
              return uid != null ? np.load(uid) : Future.value();
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: np.list.length,
              itemBuilder: (_, i) => _NotificationTile(
                notification: np.list[i],
                onTap: () => _onNotificationTap(np.list[i]),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
  });

  final NotificationModel notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: notification.isRead ? Colors.white : AppTheme.primary50.withOpacity(0.5),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        leading: CircleAvatar(
          backgroundColor: notification.isRead ? AppTheme.neutral200 : AppTheme.primary200,
          child: Icon(
            Icons.notifications_outlined,
            color: notification.isRead ? AppTheme.neutral600 : AppTheme.primary600,
          ),
        ),
        title: Text(
          notification.title,
          style: Theme.of(context).textTheme.titleSmall?.copyWith(
                fontWeight: notification.isRead ? FontWeight.w500 : FontWeight.w600,
              ),
        ),
        subtitle: notification.message.isNotEmpty
            ? Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  notification.message,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.neutral600,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              )
            : null,
        isThreeLine: notification.message.isNotEmpty,
        trailing: const Icon(Icons.chevron_right, color: AppTheme.neutral400),
        onTap: onTap,
      ),
    );
  }
}
