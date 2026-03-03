import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config.dart';
import '../models/app_settings.dart';
import '../models/user_model.dart';

class ApiService {
  static String get _base => apiBaseUrl;

  /// Safely parse response body as JSON. Returns null on empty, non-JSON, or parse error.
  static Map<String, dynamic>? _parseJson(String body) {
    if (body.isEmpty) return null;
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<AppSettings> getMobileSettings() async {
    try {
      final res = await http.get(
        Uri.parse('$_base/api/mobile/settings'),
        headers: {'Accept': 'application/json'},
      );
      if (res.statusCode != 200) return const AppSettings();
      final data = _parseJson(res.body);
      if (data != null && data['data'] != null && data['data'] is Map) {
        return AppSettings.fromJson(
            Map<String, dynamic>.from(data['data'] as Map));
      }
      return const AppSettings();
    } catch (_) {
      return const AppSettings();
    }
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final uri = Uri.parse('$_base/api/auth/login');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );
      final data = _parseJson(res.body);
      if (data != null) return data;
      final isHtml = res.body.trimLeft().toLowerCase().startsWith('<!doctype') ||
          res.body.trimLeft().toLowerCase().startsWith('<html');
      return {
        'success': false,
        'error': res.statusCode == 404
            ? 'Service not found. Check server URL.'
            : res.statusCode == 401
                ? 'Invalid email or password'
                : isHtml
                    ? 'Server returned page (${res.statusCode}). Check URL: $_base'
                    : 'Invalid response (${res.statusCode})',
      };
    } catch (e) {
      return {'success': false, 'error': 'Network error: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> signup({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? address,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/auth/signup'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
          if (phone != null) 'phone': phone,
          if (address != null) 'address': address,
        }),
      );
      final data = _parseJson(res.body);
      if (data != null) return data;
      return {
        'success': false,
        'error': 'Invalid response (${res.statusCode})',
      };
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Temporary: employee signup via POST /api/employees (can be disabled from admin later).
  static Future<Map<String, dynamic>> signupEmployee({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/employees'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      );
      final data = _parseJson(res.body);
      if (data != null) return data;
      return {'success': false, 'error': 'Invalid response (${res.statusCode})'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/auth/forgot-password'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      final data = _parseJson(res.body);
      if (data != null) return data;
      return {
        'success': false,
        'message': 'Invalid response (${res.statusCode})',
      };
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<UserModel?> getMe(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$_base/api/auth/me?userId=$userId'),
        headers: {'Accept': 'application/json'},
      );
      if (res.statusCode != 200) return null;
      final data = _parseJson(res.body);
      if (data != null &&
          data['success'] == true &&
          data['data'] != null &&
          data['data'] is Map) {
        return UserModel.fromJson(
            Map<String, dynamic>.from(data['data'] as Map));
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> registerFcmToken(
      String userId, String token) async {
    try {
      final res = await http.post(
        Uri.parse('$_base/api/fcm/register'),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'userId': userId, 'token': token}),
      );
      final data = _parseJson(res.body);
      if (data != null) return data;
      return {'success': false, 'error': 'Invalid response'};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
