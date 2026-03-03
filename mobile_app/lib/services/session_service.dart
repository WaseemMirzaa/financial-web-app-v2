import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_settings.dart';
import '../models/user_model.dart';

class SessionService {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  static const _userKey = 'user';
  static const _settingsKey = 'mobile_settings';

  static Future<void> saveUser(UserModel user) async {
    await _storage.write(
      key: _userKey,
      value: jsonEncode(user.toJson()),
    );
  }

  static Future<UserModel?> getUser() async {
    final s = await _storage.read(key: _userKey);
    if (s == null) return null;
    try {
      return UserModel.fromJson(
          Map<String, dynamic>.from(jsonDecode(s) as Map));
    } catch (_) {
      return null;
    }
  }

  static Future<void> clearUser() async {
    await _storage.delete(key: _userKey);
  }

  static Future<void> saveSettings(AppSettings settings) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_settingsKey, jsonEncode({
      'forgetPasswordEnabled': settings.forgetPasswordEnabled,
      'signupEnabled': settings.signupEnabled,
      'deleteAccountEnabled': settings.deleteAccountEnabled,
    }));
  }

  static Future<AppSettings> getSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final s = prefs.getString(_settingsKey);
    if (s == null) return const AppSettings();
    try {
      return AppSettings.fromJson(
          Map<String, dynamic>.from(jsonDecode(s) as Map));
    } catch (_) {
      return const AppSettings();
    }
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_settingsKey);
  }
}
