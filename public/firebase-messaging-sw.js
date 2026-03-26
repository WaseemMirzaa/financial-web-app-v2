// FCM service worker — replace firebaseConfig with the same values as NEXT_PUBLIC_FIREBASE_* in .env.local
// Or generate this file in CI from env. Do not commit real API keys to a public repo.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

var firebaseConfig = {
  apiKey: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID',
};

firebase.initializeApp(firebaseConfig);
var messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  var notification = payload.notification || {};
  var data = payload.data || {};
  var title = notification.title || data.title_en || 'Notification';
  var body = notification.body || data.body_en || '';
  var locale = data.user_locale || 'en';
  if (locale === 'ar' && data.title_ar) title = data.title_ar;
  if (locale === 'ar' && data.body_ar) body = data.body_ar;
  return self.registration.showNotification(title, {
    body: body,
    icon: '/icon',
    tag: data.notification_id || 'default',
    silent: true,
    vibrate: [200, 100, 200],
  }).then(function() {
    return clients.matchAll({ type: 'window', includeUncontrolled: true });
  }).then(function(clientList) {
    clientList.forEach(function(c) { c.postMessage({ type: 'PENDING_BEEP' }); });
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/?fromNotification=1');
    })
  );
});
