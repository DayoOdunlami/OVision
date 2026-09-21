import React from 'react';
import { createRoot } from 'react-dom/client';
import PrayApp from './PrayApp.jsx';
import './pray.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrayApp />
  </React.StrictMode>
);
