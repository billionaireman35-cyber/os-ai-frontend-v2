import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Shows a small fixed banner offering to reload once a new service worker
// has finished installing and is waiting to take over. Plain DOM, not a
// React component - it needs to work independent of the app's own mount
// lifecycle, since an update can be detected before or after React renders.
function showUpdateBanner(registration) {
  if (document.getElementById('os-ai-update-banner')) return; // already shown
  const banner = document.createElement('div');
  banner.id = 'os-ai-update-banner';
  banner.style.cssText = `
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    z-index: 9999; background: #0A0A0A; border: 1px solid rgba(255,255,255,0.12);
    color: #F5F5F0; padding: 12px 16px; border-radius: 14px;
    display: flex; align-items: center; gap: 12px;
    font-family: system-ui, sans-serif; font-size: 13px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  `;
  const label = document.createElement('span');
  label.textContent = 'A new version is available.';
  const button = document.createElement('button');
  button.textContent = 'Refresh';
  button.style.cssText = `
    background: #F97316; color: #000; border: none; padding: 6px 14px;
    border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;
  `;
  button.onclick = () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
  };
  banner.appendChild(label);
  banner.appendChild(button);
  document.body.appendChild(banner);
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered');

      // A worker may already be waiting from a previous page load.
      if (registration.waiting) showUpdateBanner(registration);

      // Or one may finish installing during this session.
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(registration);
          }
        });
      });
    })
    .catch((err) => console.error('Service Worker registration failed:', err));

  // Once the new worker actually takes control (after the user clicks
  // Refresh), reload so the page runs on the new version's assets.
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
