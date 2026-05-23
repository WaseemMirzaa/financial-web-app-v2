import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Serves FCM service worker with Firebase config from server env (same as NEXT_PUBLIC_FIREBASE_*).
 */
export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  const configJson = JSON.stringify(firebaseConfig);

  const js = `importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

var firebaseConfig = ${configJson};

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
`;

  return new NextResponse(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
  });
}
