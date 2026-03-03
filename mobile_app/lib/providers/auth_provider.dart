import 'package:flutter/foundation.dart';

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

  Future<bool> login(String email, String password) async {
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
      _error = _mapAuthError(data, isSignup: false);
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
      _error = _mapAuthError(data, isSignup: true);
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
      _error = _mapAuthError(data, isSignup: true);
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

  String _mapAuthError(Map<String, dynamic> data, {required bool isSignup}) {
    final key = data['errorKey']?.toString() ?? '';
    final raw = data['error']?.toString() ?? '';

    // Backend standard auth keys
    if (key == 'error.invalidEmailOrPassword') {
      return 'Email or password is incorrect';
    }
    if (key == 'error.userNotFound') {
      return 'No account found with these details';
    }
    if (key == 'error.userInactive') {
      return 'Your account is inactive. Please contact support.';
    }
    if (key == 'error.emailAlreadyExists' || key == 'error.userAlreadyExists') {
      return 'This email is already registered';
    }

    // Generic network / URL issues
    if (raw.contains('Service not found')) {
      return 'Service not found. Please check the server URL and try again.';
    }
    if (raw.contains('Server returned page')) {
      return 'Server returned an HTML page instead of JSON. Please check the API URL.';
    }
    if (raw.toLowerCase().contains('network error')) {
      return 'Network error. Please check your internet connection and try again.';
    }

    // Fallback based on context
    return isSignup
        ? 'Something went wrong while creating the account. Please try again.'
        : 'Something went wrong while signing in. Please try again.';
  }
}
