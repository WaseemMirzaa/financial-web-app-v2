import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/mobile_strings.dart';
import '../models/user_model.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../providers/settings_provider.dart';
import 'login_screen.dart';
import 'notifications_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final settings = context.watch<SettingsProvider>();
    final t = MobileStrings(context.watch<LocaleProvider>().locale);
    final user = auth.user;
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final canDelete = (user.role == UserRole.admin || user.role == UserRole.customer) &&
        settings.deleteAccountEnabled;

    return Scaffold(
      backgroundColor: AppTheme.bgPage,
      appBar: AppBar(
        title: Text(t.profileTitle),
        backgroundColor: AppTheme.primary500,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primary50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.person_rounded,
                          size: 28,
                          color: AppTheme.primary600,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppTheme.neutral900,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user.email,
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppTheme.neutral600,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (user.phone != null || user.address != null) ...[
                    const SizedBox(height: 16),
                    if (user.phone != null)
                      Row(
                        children: [
                          Icon(Icons.phone_outlined, size: 18, color: AppTheme.neutral500),
                          const SizedBox(width: 8),
                          Text(user.phone!, style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    if (user.address != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.location_on_outlined, size: 18, color: AppTheme.neutral500),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              user.address!,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTheme.primary50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _roleLabel(user.role, t),
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primary700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          _menuTile(
            context,
            icon: Icons.notifications_outlined,
            title: t.notificationsTitle,
            onTap: () => _openNotifications(context),
          ),
          _menuTile(
            context,
            icon: Icons.privacy_tip_outlined,
            title: t.privacyPolicy,
            onTap: () => _openUrl(context, '/privacy'),
          ),
          _menuTile(
            context,
            icon: Icons.description_outlined,
            title: t.termsOfService,
            onTap: () => _openUrl(context, '/terms'),
          ),
          const SizedBox(height: 8),
          _menuTile(
            context,
            icon: Icons.logout,
            title: t.logout,
            iconColor: AppTheme.primary600,
            onTap: () async {
              await auth.logout();
              if (!context.mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (_) => false,
              );
            },
          ),
          if (canDelete)
            _menuTile(
              context,
              icon: Icons.delete_outline,
              title: t.deleteAccount,
              iconColor: AppTheme.error,
              titleColor: AppTheme.error,
              onTap: () => _confirmDelete(context, auth, t),
            ),
        ],
      ),
    );
  }

  Widget _menuTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? iconColor,
    Color? titleColor,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Icon(icon, color: iconColor ?? AppTheme.neutral600, size: 24),
        title: Text(
          title,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: titleColor ?? AppTheme.neutral900,
                fontWeight: FontWeight.w500,
              ),
        ),
        trailing: Icon(Icons.chevron_left, color: titleColor ?? AppTheme.neutral400),
        onTap: onTap,
      ),
    );
  }

  String _roleLabel(UserRole r, MobileStrings t) {
    switch (r) {
      case UserRole.admin:
        return t.roleAdmin;
      case UserRole.employee:
        return t.roleEmployeeLabel;
      case UserRole.customer:
        return t.roleCustomerLabel;
    }
  }

  void _openNotifications(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    );
  }

  void _openUrl(BuildContext context, String path) {
    final t = MobileStrings(context.read<LocaleProvider>().locale);
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(
            title: const Text(''),
            backgroundColor: AppTheme.primary500,
            foregroundColor: Colors.white,
          ),
          body: Center(child: Text(t.openLinkHint)),
        ),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, AuthProvider auth, MobileStrings t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t.deleteAccountConfirmTitle),
        content: Text(t.deleteAccountConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(t.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: AppTheme.error),
            child: Text(t.delete),
          ),
        ],
      ),
    );
    if (ok == true) {
      await auth.logout();
      if (!context.mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    }
  }
}
