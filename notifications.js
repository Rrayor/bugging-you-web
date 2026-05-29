/**
 * @module notifications
 *
 * Wraps the Web Notifications API.
 *
 * Isolated from app.js so the permission-state logic is easy to follow
 * without having to scan through DOM manipulation code.
 */

/**
 * Requests notification permission (if not yet decided) and fires an
 * immediate OS notification with the given text.
 *
 * Returns without throwing when notifications are unavailable or denied –
 * the app treats "Bug me" as best-effort; failing silently is better than
 * surfacing a confusing error for something the user may have intentionally
 * blocked.
 *
 * @param {string} text - The note text to send as the notification body.
 * @returns {Promise<void>}
 */
async function bugMe(text) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'default') {
    // Prompt the user.  We only ask when they explicitly click "Bug me",
    // not on page load, so the request feels contextual rather than pushy.
    await Notification.requestPermission();
  }

  // Permission might still be 'denied' (either pre-existing or just denied
  // in the prompt above), so we check again before trying to notify.
  if (Notification.permission !== 'granted') return;

  // Prefer service-worker notifications for better cross-platform reliability
  // (notably Android-installed PWAs), then fall back to page notifications.
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification('🐛 Bugging you!', {
          body: text,
          icon: '/icons/icon.svg',
        });
        return;
      }
    } catch {
      // Fall through to constructor-based notification.
    }
  }

  // Desktop browsers generally support page-context notifications well.
  new Notification('🐛 Bugging you!', {
    body: text,
    icon: '/icons/icon.svg',
  });
}

export { bugMe };
