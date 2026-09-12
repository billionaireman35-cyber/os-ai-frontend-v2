import { useEffect } from 'react';
import { api } from '../utils/api';

const PROMPTED_KEY = 'os-ai-push-prompted';

const DEBUG_ID = 'os-ai-push-debug';

function pushDebug(message, data) {
  const detail = data === undefined
    ? ''
    : ` ${JSON.stringify(data, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )}`;

  const line = `${message}${detail}`;
  console.info('[OS AI Push]', line);

  try {
    let panel = document.getElementById(DEBUG_ID);

    if (!panel) {
      panel = document.createElement('pre');
      panel.id = DEBUG_ID;
      panel.style.cssText = [
        'position:fixed',
        'left:10px',
        'right:10px',
        'bottom:10px',
        'z-index:2147483647',
        'max-height:45vh',
        'overflow:auto',
        'padding:12px',
        'background:#111',
        'color:#00ff88',
        'border:2px solid #00ff88',
        'border-radius:10px',
        'font:12px/1.45 monospace',
        'white-space:pre-wrap',
        'box-sizing:border-box'
      ].join(';');

      document.body.appendChild(panel);
    }

    const existing = panel.textContent || '';
    panel.textContent =
      `${existing}${existing ? '\n' : ''}${line}`.slice(-12000);
  } catch (error) {
    console.warn('[OS AI Push] debug display failed', error);
  }
}


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

export function usePushSubscription(user) {
  useEffect(() => {
    pushDebug('[OS AI Push] effect started', {
      hasUser: Boolean(user),
      notification: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
    });

    if (!user) {
      pushDebug('[OS AI Push] STOP: no authenticated user');
      return;
    }

    if (typeof window === 'undefined') {
      pushDebug('[OS AI Push] STOP: window unavailable');
      return;
    }

    if (!('Notification' in window)) {
      pushDebug('[OS AI Push] STOP: Notification API unavailable');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      pushDebug('[OS AI Push] STOP: Service Worker API unavailable');
      return;
    }

    if (!('PushManager' in window)) {
      pushDebug('[OS AI Push] STOP: PushManager unavailable');
      return;
    }

    const prompted = localStorage.getItem(PROMPTED_KEY);

    pushDebug('[OS AI Push] prompted flag:', prompted);
    console.info(
      '[OS AI Push] notification permission:',
      Notification.permission
    );

    if (prompted === '1') {
      pushDebug(
        '[OS AI Push] registration flag already set; verifying backend registration'
      );
    }

    if (Notification.permission === 'denied') {
      console.info(
        '[OS AI Push] STOP: notification permission denied'
      );
      return;
    }

    let cancelled = false;

    const setupPush = async () => {
      try {
        pushDebug('[OS AI Push] setup started');

          let permission = Notification.permission;

          if (permission !== 'granted') {
            permission = await Notification.requestPermission();
          }

        console.info(
          '[OS AI Push] permission result:',
          permission,
          'cancelled:',
          cancelled
        );

        if (cancelled || permission !== 'granted') {
          console.info(
            '[OS AI Push] STOP: permission not granted'
          );
          return;
        }

        console.info(
          '[OS AI Push] requesting VAPID public key'
        );

        const keyResponse =
          await api.get('/push/vapid-public-key');

        pushDebug('[OS AI Push] VAPID response received', {
          hasPublicKey: Boolean(keyResponse.data?.publicKey),
        });

        const { publicKey } = keyResponse.data;

        if (!publicKey) {
          throw new Error('VAPID public key missing');
        }

        console.info(
          '[OS AI Push] waiting for service worker'
        );

        const registration =
          await navigator.serviceWorker.ready;

        console.info(
          '[OS AI Push] service worker ready'
        );

        let subscription =
          await registration.pushManager.getSubscription();

        console.info(
          '[OS AI Push] existing subscription:',
          Boolean(subscription)
        );

        if (!subscription) {
          console.info(
            '[OS AI Push] creating PushSubscription'
          );

          subscription =
            await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(publicKey),
            });

          console.info(
            '[OS AI Push] PushSubscription created'
          );
        }

        console.info(
          '[OS AI Push] registering subscription with backend'
        );

        await api.post(
          '/push/subscribe',
          subscription.toJSON()
        );

          localStorage.setItem(PROMPTED_KEY, '1');

          pushDebug(
            '[OS AI Push] SUCCESS: backend registration complete'
          );
      } catch (error) {
        pushDebug(
          '[OS AI Push] FAILED:',
          error?.response?.data || error?.message || error
        );
      }
    };

    setupPush();

    return () => {
      cancelled = true;
      pushDebug('[OS AI Push] effect cleanup');
    };
  }, [user]);
}
