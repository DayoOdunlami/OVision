import React from 'react';
import { createRoot } from 'react-dom/client';
import AbideApp from './AbideApp.jsx';
import './abide.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AbideApp />
  </React.StrictMode>
);
