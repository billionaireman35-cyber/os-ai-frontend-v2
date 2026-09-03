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
    if (!user) return;
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (!('serviceWorker' in navigator)) return;
    if (!('PushManager' in window)) return;

    // Only attempt the automatic prompt once.
    if (localStorage.getItem(PROMPTED_KEY) === '1') return;

    // Don't repeatedly bother users who have explicitly denied notifications.
    if (Notification.permission === 'denied') return;

    let cancelled = false;

    const setupPush = async () => {
      try {
        // Set immediately so React re-renders or duplicate mounts
        // cannot trigger multiple permission prompts.
        localStorage.setItem(PROMPTED_KEY, '1');

        const permission = await Notification.requestPermission();

        if (cancelled || permission !== 'granted') {
          return;
        }

        const keyResponse = await api.get('/push/vapid-public-key');
        const { publicKey } = keyResponse.data;

        if (!publicKey) {
          throw new Error('VAPID public key missing');
        }

        const registration = await navigator.serviceWorker.ready;

        let subscription =
          await registration.pushManager.getSubscription();

        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
        }

        await api.post(
          '/push/subscribe',
          subscription.toJSON()
        );

        console.info('[OS AI] Push notifications subscribed');
      } catch (error) {
        console.warn(
          '[OS AI] Push subscription setup failed:',
          error?.response?.data || error
        );
      }
    };

    setupPush();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
