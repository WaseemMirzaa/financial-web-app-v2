/// Base URL for the web app API. Change for production.
/// Android emulator: use http://10.0.2.2:3000 for localhost:3000
const String kBaseUrl = String.fromEnvironment(
  'BASE_URL',
  defaultValue: 'http://localhost:3000',
);

/// Base URL without trailing slash for building paths like base + '/api/...'
String get apiBaseUrl => kBaseUrl.endsWith('/') ? kBaseUrl.substring(0, kBaseUrl.length - 1) : kBaseUrl;
