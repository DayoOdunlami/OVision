import React from 'react';
import { createRoot } from 'react-dom/client';
import FlourishApp from './FlourishApp.jsx';
import './flourish.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FlourishApp />
  </React.StrictMode>
);
