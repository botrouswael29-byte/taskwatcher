// Task Watcher Service Worker
// Full support for Mobile Notification Shade (القائمة المنسدلة) and Lock Screen Notifications (شاشة القفل)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for background push / notification events from clients
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'SHOW_MOBILE_NOTIFICATION' && payload) {
    self.registration.showNotification(payload.title, payload.options);
  }
});

// Handle notification click and action buttons directly from Lock Screen or Dropdown Shade
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // 1. User tapped "Done" action button directly from Lock Screen or Dropdown Notification Shade
      if (action === 'mark_done') {
        let broadcasted = false;
        for (const client of clientList) {
          client.postMessage({
            type: 'TASK_COMPLETED_FROM_NOTIFICATION',
            data,
          });
          broadcasted = true;
        }

        // Show brief confirmation badge in notification shade
        const confirmTitle = data.language === 'ar' ? 'Task Watcher — تم الإنجاز' : 'Task Watcher — Done';
        const confirmBody = data.language === 'ar'
          ? `✓ تم تسجيل إنجاز "${data.title || 'المهمة'}" بنجاح.`
          : `✓ "${data.title || 'Task'}" marked as completed.`;

        await self.registration.showNotification(confirmTitle, {
          body: confirmBody,
          icon: '/icon.svg',
          badge: '/badge.svg',
          tag: `tw-done-${Date.now()}`,
          renotify: false,
          silent: true,
        });

        // Auto clear confirmation notification after 4s
        setTimeout(async () => {
          const notifs = await self.registration.getNotifications({ tag: `tw-done-${Date.now()}` });
          notifs.forEach((n) => n.close());
        }, 4000);

        return;
      }

      // 2. User tapped the notification body or "Open" action button
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NAVIGATE_DATE',
            date: data.date,
          });
          return client.focus();
        }
      }

      // 3. If no window is currently open, launch the app with target date
      const targetUrl = data.date ? `/?date=${data.date}` : '/';
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// Handle notification dismissal
self.addEventListener('notificationclose', (event) => {
  // Optional cleanup
});
