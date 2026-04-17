import React from 'react';
import { createRoot } from 'react-dom/client';
import KoiBoard from './KoiBoard.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KoiBoard />
  </React.StrictMode>
);
