import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../services/notification_refresh_trigger.dart';

class NotificationsProvider with ChangeNotifier {
  final List<NotificationModel> _list = [];
  bool _loading = false;
  String? _userId;
  String? _locale;
  StreamSubscription<void>? _pushSubscription;

  List<NotificationModel> get list => List.unmodifiable(_list);
  bool get loading => _loading;
  int get unreadCount => _list.where((n) => !n.isRead).length;

  void setUserId(String? id) {
    _userId = id;
  }

  void setLocale(String? locale) {
    _locale = locale;
  }

  void listenToPushRefresh() {
    _pushSubscription?.cancel();
    _pushSubscription = NotificationRefreshTrigger.instance.stream.listen((_) {
      if (_userId != null) load();
    });
  }

  @override
  void dispose() {
    _pushSubscription?.cancel();
    super.dispose();
  }

  Future<void> load([String? userId]) {
    final uid = userId ?? _userId;
    if (uid == null || uid.isEmpty) return Future.value();
    _userId = uid;
    _loading = true;
    notifyListeners();
    return ApiService.getNotifications(uid, locale: _locale).then((items) {
      _list
        ..clear()
        ..addAll(items);
      _loading = false;
      notifyListeners();
    }).catchError((_) {
      _loading = false;
      notifyListeners();
    });
  }

  Future<void> markAsRead(String id) async {
    final ok = await ApiService.markNotificationRead(id);
    if (!ok) return;
    final i = _list.indexWhere((n) => n.id == id);
    if (i >= 0) {
      _list[i] = NotificationModel(
        id: _list[i].id,
        userId: _list[i].userId,
        title: _list[i].title,
        message: _list[i].message,
        type: _list[i].type,
        isRead: true,
        createdAt: _list[i].createdAt,
      );
      notifyListeners();
    }
  }

  Future<void> markAllAsRead() async {
    final unread = _list.where((n) => !n.isRead).toList();
    for (final n in unread) {
      await ApiService.markNotificationRead(n.id);
    }
    for (var i = 0; i < _list.length; i++) {
      if (!_list[i].isRead) {
        _list[i] = NotificationModel(
          id: _list[i].id,
          userId: _list[i].userId,
          title: _list[i].title,
          message: _list[i].message,
          type: _list[i].type,
          isRead: true,
          createdAt: _list[i].createdAt,
        );
      }
    }
    notifyListeners();
  }
}
