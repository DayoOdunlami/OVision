import React from 'react';
import { createRoot } from 'react-dom/client';
import TodayApp from './TodayApp.jsx';
import './today.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TodayApp />
  </React.StrictMode>
);
