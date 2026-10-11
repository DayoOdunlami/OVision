import React from 'react';
import { createRoot } from 'react-dom/client';
import BirdsApp from './BirdsApp.jsx';
import './birds.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BirdsApp />
  </React.StrictMode>
);
