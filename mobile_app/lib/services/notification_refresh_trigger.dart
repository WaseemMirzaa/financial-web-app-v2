import 'dart:async';

/// Singleton used by FCM to signal that notifications list should refresh.
class NotificationRefreshTrigger {
  NotificationRefreshTrigger._();
  static final NotificationRefreshTrigger instance = NotificationRefreshTrigger._();

  final _controller = StreamController<void>.broadcast();
  Stream<void> get stream => _controller.stream;

  void trigger() {
    if (!_controller.isClosed) _controller.add(null);
  }
}
