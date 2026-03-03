/// Base URL for the web app API.
/// For production mobile app, default to live domain.
const String kBaseUrl = String.fromEnvironment(
  'BASE_URL',
  defaultValue: 'https://alkhalijtamweel.com/',
);

/// Base URL without trailing slash for building paths like base + '/api/...'
String get apiBaseUrl => kBaseUrl.endsWith('/') ? kBaseUrl.substring(0, kBaseUrl.length - 1) : kBaseUrl;
