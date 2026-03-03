import 'package:flutter/foundation.dart';

import '../models/app_settings.dart';
import '../services/api_service.dart';
import '../services/session_service.dart';

class SettingsProvider with ChangeNotifier {
  AppSettings _settings = const AppSettings();
  bool _loaded = false;

  AppSettings get settings => _settings;
  bool get loaded => _loaded;

  bool get forgetPasswordEnabled => _settings.forgetPasswordEnabled;
  bool get signupEnabled => _settings.signupEnabled;
  bool get deleteAccountEnabled => _settings.deleteAccountEnabled;

  Future<void> loadFromApi() async {
    try {
      final s = await ApiService.getMobileSettings();
      _settings = s;
      await SessionService.saveSettings(s);
      _loaded = true;
      notifyListeners();
    } catch (_) {
      await loadFromStorage();
    }
  }

  Future<void> loadFromStorage() async {
    _settings = await SessionService.getSettings();
    _loaded = true;
    notifyListeners();
  }
}
