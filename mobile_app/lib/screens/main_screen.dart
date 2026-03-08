import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/user_model.dart';
import '../providers/auth_provider.dart';
import '../providers/locale_provider.dart';
import '../providers/notifications_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/web_view_tab.dart';
import 'login_screen.dart';
import 'profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _index = 0;

  List<_NavItem> _navItemsFor(UserModel user, String locale) {
    final isAr = locale == 'ar';
    return [
      _NavItem(Icons.dashboard, isAr ? 'لوحة التحكم' : 'Dashboard', user.homePath),
      _NavItem(Icons.menu_rounded, isAr ? 'القائمة' : 'Menu', 'menu'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final locale = context.watch<LocaleProvider>();
    final user = auth.user;
    if (user == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (_) => false,
        );
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final items = _navItemsFor(user, locale.locale);
    final notificationsProvider = context.read<NotificationsProvider>();
    notificationsProvider.setUserId(user.id);
    notificationsProvider.listenToPushRefresh();

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Container(
          color: AppTheme.bgPage,
          child: IndexedStack(
            index: _index,
            children: [
              for (var i = 0; i < items.length; i++)
                items[i].path == 'menu'
                    ? const ProfileScreen(key: ValueKey('menu'))
                    : WebViewTab(
                        key: ValueKey(items[i].path),
                        path: items[i].path,
                        userId: user.id,
                        userJson: user.toJson(),
                        onWebLogout: () {
                          auth.logout();
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                            (_) => false,
                          );
                        },
                        onLocaleFromWeb: (l) => locale.setLocale(l),
                      ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Color(0x14000000),
              blurRadius: 16,
              offset: Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: BottomNavigationBar(
            currentIndex: _index,
            onTap: (i) => setState(() => _index = i),
            type: BottomNavigationBarType.fixed,
            items: [
              for (final item in items)
                BottomNavigationBarItem(
                  icon: Icon(item.icon),
                  label: item.label,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String path;
  _NavItem(this.icon, this.label, this.path);
}
