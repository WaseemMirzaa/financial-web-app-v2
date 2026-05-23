# Alkhalij Tamweel Mobile (Flutter)

## Prerequisites

- [FVM](https://fvm.app/) (`brew install fvm`)
- Android Studio / Android SDK
- Xcode + CocoaPods (for iOS on macOS)

## One-time setup

```bash
cd mobile_app
fvm install 3.35.7   # if not already cached
fvm use 3.35.7
fvm flutter pub get
cd ios && pod install && cd ..
```

Place `android/app/google-services.json` from Firebase Console (package `com.khalijtamweel.financial_mobile`). It is gitignored.

For release Android builds, copy `android/key.properties.example` → `android/key.properties` and add your upload keystore (also gitignored).

## Run

```bash
cd mobile_app
fvm flutter devices
fvm flutter run                    # debug on connected device/emulator
fvm flutter run --release          # release mode
```

VS Code / Cursor uses `.vscode/settings.json` → Flutter SDK `.fvm/versions/3.35.7`.

## API base URL

Default production API: `https://alkhalijtamweel.com/` (`lib/config.dart`). Override:

```bash
fvm flutter run --dart-define=BASE_URL=https://your-server.com/
```

## Common commands

```bash
fvm flutter clean && fvm flutter pub get
fvm flutter build appbundle --release
fvm flutter build ios --release   # macOS + signing
fvm flutter doctor -v
```
