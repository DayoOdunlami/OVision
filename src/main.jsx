import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// "Start the day on Today" (Admin): the first visit to the pond in a
// session goes to /today/ instead. A plain / only — never a link with a
// board, a world or the screensaver in it.
try {
  if (localStorage.getItem('vb.home') === 'today' && !location.search && !sessionStorage.getItem('todaySeen')) {
    sessionStorage.setItem('todaySeen', '1');
    location.replace('/today/');
  }
} catch { /* ignore */ }

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
