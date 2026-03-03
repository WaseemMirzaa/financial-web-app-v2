import 'package:flutter/foundation.dart';

import '../services/session_service.dart';

class LocaleProvider with ChangeNotifier {
  String _locale = 'en';
  bool _loaded = false;

  String get locale => _locale;
  bool get loaded => _loaded;
  bool get isAr => _locale == 'ar';

  Future<void> load() async {
    _locale = await SessionService.getLocale();
    _loaded = true;
    notifyListeners();
  }

  Future<void> setLocale(String newLocale) async {
    if (newLocale != 'en' && newLocale != 'ar') return;
    _locale = newLocale;
    await SessionService.saveLocale(_locale);
    notifyListeners();
  }
}
