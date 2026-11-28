// Mapstar Service Worker for Push & In-App Notifications
const CACHE_NAME = 'mapstar-sw-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Handle Push notifications from Web Push server
self.addEventListener('push', (event) => {
  let data = {
    title: 'Mapstar Notification',
    body: 'You have a new update on Mapstar',
    icon: '/icon.svg',
    badge: '/icon.svg',
    url: '/',
    tag: 'mapstar-general',
  }

  if (event.data) {
    try {
      const payload = event.data.json()
      data = { ...data, ...payload }
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      channelId: data.channelId,
      tab: data.tab || 'world',
    },
    tag: data.tag || `mapstar-${data.channelId || 'notif'}`,
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle Notification click: focus existing window or open new one to target conversation
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'
  const targetChannelId = event.notification.data?.channelId

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and post a message to switch to the conversation
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if (targetChannelId) {
            client.postMessage({
              type: 'NAVIGATE_CONVERSATION',
              channelId: targetChannelId,
              tab: event.notification.data?.tab,
            })
          }
          return
        }
      }
      // If no window is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
