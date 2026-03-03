import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/user_model.dart';
import '../providers/auth_provider.dart';
import '../widgets/web_view_tab.dart';
import 'profile_screen.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _index = 0;

  List<_NavItem> _navItemsFor(UserModel user) {
    switch (user.role) {
      case UserRole.admin:
        return [
          _NavItem(Icons.dashboard, 'لوحة التحكم', user.homePath),
          _NavItem(Icons.people, 'العملاء', '${user.homePath}/customers'),
          _NavItem(Icons.chat, 'المحادثات', '${user.homePath}/chat'),
          _NavItem(Icons.menu_book, 'القائمة', 'menu'),
        ];
      case UserRole.employee:
        return [
          _NavItem(Icons.dashboard, 'الرئيسية', user.homePath),
          _NavItem(Icons.chat, 'المحادثات', '${user.homePath}/chat'),
          _NavItem(Icons.menu_book, 'القائمة', 'menu'),
        ];
      case UserRole.customer:
        return [
          _NavItem(Icons.home, 'الرئيسية', user.homePath),
          _NavItem(Icons.chat, 'المحادثات', '${user.homePath}/chat'),
          _NavItem(Icons.menu_book, 'القائمة', 'menu'),
        ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    if (user == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final items = _navItemsFor(user);

    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [
          for (var i = 0; i < items.length; i++)
            items[i].path == 'menu'
                ? const ProfileScreen()
                : WebViewTab(
                    path: items[i].path,
                    userId: user.id,
                    onWebLogout: () => auth.logout(),
                  ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
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
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String path;
  _NavItem(this.icon, this.label, this.path);
}
