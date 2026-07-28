import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'

console.log('main.jsx loaded');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
} else {
  document.body.innerHTML = '<div style="padding:2rem;background:#0A1114;color:#E9E4D8;text-align:center;font-family:sans-serif;"><h1>OS AI</h1><p>Could not find root element. Please refresh.</p></div>';
}
