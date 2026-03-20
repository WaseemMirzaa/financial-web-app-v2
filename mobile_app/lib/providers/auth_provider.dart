import 'package:flutter/foundation.dart';

import '../l10n/mobile_strings.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/session_service.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> loadStoredUser() async {
    _user = await SessionService.getUser();
    notifyListeners();
  }

  Future<bool> validateSession() async {
    final u = await SessionService.getUser();
    if (u == null) return false;
    final me = await ApiService.getMe(u.id);
    if (me == null) {
      await SessionService.clearUser();
      _user = null;
      notifyListeners();
      return false;
    }
    _user = me;
    await SessionService.saveUser(me);
    notifyListeners();
    return true;
  }

  Future<bool> login(String email, String password, {String locale = 'en'}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.login(email, password);
      if (data['success'] == true && data['data'] != null) {
        _user = UserModel.fromJson(
            Map<String, dynamic>.from(data['data'] as Map));
        await SessionService.saveUser(_user!);
        _error = null;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = _mapAuthError(data, isSignup: false, locale: locale);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> signup({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? address,
    String locale = 'en',
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.signup(
        name: name,
        email: email,
        password: password,
        phone: phone,
        address: address,
      );
      if (data['success'] == true && data['data'] != null) {
        _user = UserModel.fromJson(
            Map<String, dynamic>.from(data['data'] as Map));
        await SessionService.saveUser(_user!);
        _error = null;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = _mapAuthError(data, isSignup: true, locale: locale);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Temporary: employee signup (can be turned off from admin dashboard via API).
  Future<bool> signupEmployee({
    required String name,
    required String email,
    required String password,
    String locale = 'en',
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await ApiService.signupEmployee(
        name: name,
        email: email,
        password: password,
      );
      if (data['success'] == true && data['data'] != null) {
        final d = Map<String, dynamic>.from(data['data'] as Map);
        _user = UserModel.fromJson(d);
        await SessionService.saveUser(_user!);
        _error = null;
        _isLoading = false;
        notifyListeners();
        return true;
      }
      _error = _mapAuthError(data, isSignup: true, locale: locale);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await SessionService.clearUser();
    _user = null;
    _error = null;
    notifyListeners();
  }

  String _mapAuthError(
    Map<String, dynamic> data, {
    required bool isSignup,
    required String locale,
  }) {
    final t = MobileStrings(locale);
    final key = data['errorKey']?.toString() ?? '';
    final raw = data['error']?.toString() ?? '';

    if (key == 'error.invalidEmailOrPassword') {
      return t.authInvalidCredentials;
    }
    if (key == 'error.userNotFound') {
      return t.authUserNotFound;
    }
    if (key == 'error.userInactive') {
      return t.authInactive;
    }
    if (key == 'error.emailAlreadyExists' || key == 'error.userAlreadyExists') {
      return t.authEmailExists;
    }

    if (raw.contains('Service not found')) {
      return t.authServiceNotFound;
    }
    if (raw.contains('Server returned page')) {
      return t.authServerHtml;
    }
    if (raw.toLowerCase().contains('network error')) {
      return t.authNetworkError;
    }

    return isSignup ? t.authGenericSignup : t.authGenericLogin;
  }
}
