// Firebase Cloud Messaging Service Worker (ES5 for broad support)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

var firebaseConfig = {
  apiKey: 'AIzaSyAD8qK621xenufo3v027lhaQwNtwuVBW38',
  authDomain: 'spotandvibe-f74d0.firebaseapp.com',
  projectId: 'spotandvibe-f74d0',
  storageBucket: 'spotandvibe-f74d0.firebasestorage.app',
  messagingSenderId: '374701282125',
  appId: '1:374701282125:web:659c7751df41e07ff1dd04',
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
