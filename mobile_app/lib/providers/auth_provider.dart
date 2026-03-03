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
      _error = data['error']?.toString() ?? data['errorKey']?.toString() ?? 'Login failed';
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
      _error = data['error']?.toString() ?? data['errorKey']?.toString() ?? 'Signup failed';
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
}
