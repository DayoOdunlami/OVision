import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/literata/400.css';
import '@fontsource/literata/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import './tokens.css';
import './app.css';
import App from './App.jsx';
import { isNight, resolveNow, seasonKey } from './model.js';

const params = new URLSearchParams(location.search);
const now = resolveNow(location.search);
document.documentElement.dataset.time = isNight(now) ? 'night' : 'day';
document.documentElement.dataset.season = seasonKey(params.get('season') || '');
if (params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.dataset.motion = 'off';
}

const theme = document.querySelector('meta[name="theme-color"]');
if (theme) theme.setAttribute('content', isNight(now) ? '#161c28' : '#efe6d6');

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
