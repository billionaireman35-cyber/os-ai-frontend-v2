import { useEffect } from 'react';
import { api } from '../utils/api';

const PROMPTED_KEY = 'os-ai-push-prompted';

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
    console.info('[OS AI Push] effect started', {
      hasUser: Boolean(user),
      notification: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
    });

    if (!user) {
      console.info('[OS AI Push] STOP: no authenticated user');
      return;
    }

    if (typeof window === 'undefined') {
      console.info('[OS AI Push] STOP: window unavailable');
      return;
    }

    if (!('Notification' in window)) {
      console.info('[OS AI Push] STOP: Notification API unavailable');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.info('[OS AI Push] STOP: Service Worker API unavailable');
      return;
    }

    if (!('PushManager' in window)) {
      console.info('[OS AI Push] STOP: PushManager unavailable');
      return;
    }

    const prompted = localStorage.getItem(PROMPTED_KEY);

    console.info('[OS AI Push] prompted flag:', prompted);
    console.info(
      '[OS AI Push] notification permission:',
      Notification.permission
    );

    if (prompted === '1') {
      console.info('[OS AI Push] STOP: prompted flag already set');
      return;
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
        console.info('[OS AI Push] setup started');

        localStorage.setItem(PROMPTED_KEY, '1');
        console.info('[OS AI Push] prompted flag set');

        const permission = await Notification.requestPermission();

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

        console.info('[OS AI Push] VAPID response received', {
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

        console.info(
          '[OS AI Push] SUCCESS: backend registration complete'
        );
      } catch (error) {
        console.warn(
          '[OS AI Push] FAILED:',
          error?.response?.data || error
        );
      }
    };

    setupPush();

    return () => {
      cancelled = true;
      console.info('[OS AI Push] effect cleanup');
    };
  }, [user]);
}
