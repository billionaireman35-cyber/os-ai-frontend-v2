import { useEffect } from 'react';
import { api } from '../utils/api';

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

    if (!user) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!('Notification' in window)) {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    if (!('PushManager' in window)) {
      return;
    }

    if (Notification.permission === 'denied') {
      return;
    }

    let cancelled = false;

    const setupPush = async () => {
      try {

          let permission = Notification.permission;

          if (permission !== 'granted') {
            permission = await Notification.requestPermission();
          }

        if (cancelled || permission !== 'granted') {
          return;
        }

        const keyResponse =
          await api.get('/push/vapid-public-key');

        const { publicKey } = keyResponse.data;

        if (!publicKey) {
          throw new Error('VAPID public key missing');
        }

        const registration =
          await navigator.serviceWorker.ready;

        let subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {

          subscription =
            await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey:
                urlBase64ToUint8Array(publicKey),
            });
        }

        await api.post(
          '/push/subscribe',
          subscription.toJSON()
        );

      } catch (error) {
      }
    };

    setupPush();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
