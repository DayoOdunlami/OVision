import React from 'react';
import { createRoot } from 'react-dom/client';
import Murmuration from './Murmuration.jsx';

// /murmuration/ — the one bird experiment kept (see docs/birds-log.md):
// three.js's GPU flock as starlings at dusk. A finger scatters them.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Murmuration />
    <p className="mm-note">
      <em>Murmuration</em> · an experiment · touch to scatter them · <a href="/admin/">Admin</a>
    </p>
  </React.StrictMode>
);
