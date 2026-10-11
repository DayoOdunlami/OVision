import React from 'react';
import { createRoot } from 'react-dom/client';
import MakeApp from './MakeApp.jsx';
import './make.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MakeApp />
  </React.StrictMode>
);
