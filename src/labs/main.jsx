import React from 'react';
import { createRoot } from 'react-dom/client';
import LabsApp from './LabsApp.jsx';
import './labs.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LabsApp />
  </React.StrictMode>
);
