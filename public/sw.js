const CACHE_NAME = 'svatba-pwa-v2';
const URLS_TO_CACHE = ['/', '/dashboard', '/timeline', '/tasks', '/invitees', '/finance', '/offline'];

const DAY_MS = 1000 * 60 * 60 * 24;
const ALERT_SLOT_CACHE_KEY = '/__svatba-alert-slot';

function getAlertSlot(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) {
    return 'morning';
  }
  if (hour < 18) {
    return 'afternoon';
  }
  return 'evening';
}

function getAlertRunKey(slot, date = new Date()) {
  return `${date.toISOString().slice(0, 10)}:${slot}`;
}

async function readStoredAlertKey() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match(ALERT_SLOT_CACHE_KEY);
  return response ? response.text() : null;
}

async function storeAlertKey(value) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(ALERT_SLOT_CACHE_KEY, new Response(value));
}

async function showAlertNotification(payload) {
  if (!payload) {
    return;
  }

  await self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: payload.url ?? '/dashboard' }
  });
}

async function fetchAlertsForSlot(slot) {
  const response = await fetch(`/api/alerts?slot=${slot}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function runBackgroundAlertCheck() {
  const slot = getAlertSlot();
  const alerts = await fetchAlertsForSlot(slot);
  if (!alerts?.settings?.deadlineAlertsEnabled || !alerts.countdown?.title) {
    return;
  }

  const currentKey = getAlertRunKey(slot);
  const storedKey = await readStoredAlertKey();
  if (storedKey === currentKey) {
    return;
  }

  await storeAlertKey(currentKey);
  await showAlertNotification({
    title: alerts.countdown.notificationTitle ?? alerts.countdown.title,
    body: alerts.countdown.notificationBody ?? 'Pozri citát na dnes.',
    url: '/dashboard#countdown'
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isNavigationRequest = event.request.mode === 'navigate';

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match('/offline');
        })
    );
    return;
  }

  if (requestUrl.origin === self.location.origin) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      if (!event.data) {
        await runBackgroundAlertCheck();
        return;
      }

      const payload = event.data.json();
      await showAlertNotification(payload);
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url ?? '/dashboard#countdown'));
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'svatba-alerts') {
    event.waitUntil(runBackgroundAlertCheck());
  }
});
