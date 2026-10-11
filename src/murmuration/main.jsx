import React from 'react';
import { createRoot } from 'react-dom/client';
// /murmuration/ — the board's words, written by a murmuration of
// starlings. The brief: docs/murmuration-brief.md.
import MurmurationApp from './MurmurationApp.jsx';
import './murmuration.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MurmurationApp />
  </React.StrictMode>
);
