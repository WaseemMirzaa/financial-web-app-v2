// ignore_for_file: lines_longer_than_80_chars
//
// Replace this file by running in mobile_app:
//   dart pub global activate flutterfire_cli
//   flutterfire configure
//
// Until then, placeholders allow the project to compile; Firebase calls will fail until configured.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with [Firebase.initializeApp].
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      throw UnsupportedError(
        'DefaultFirebaseOptions have not been configured for web — run flutterfire configure.',
      );
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDX3yKJsCYxD8GynHaMom1zd73MSwqf-Jg',
    appId: '1:786188064824:android:cde668495ac25c5c3daecd',
    messagingSenderId: '786188064824',
    projectId: '786188064824',
    storageBucket: 'khalij-tamweel-app.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDX3yKJsCYxD8GynHaMom1zd73MSwqf-Jg',
    appId: '1:786188064824:ios:b02743476d4b4b813daecd',
    messagingSenderId: '786188064824',
    projectId: 'khalij-tamweel-app',
    storageBucket: 'khalij-tamweel-app.firebasestorage.app',
    iosBundleId: 'com.khalijtamweel.financialMobile',
  );
}
