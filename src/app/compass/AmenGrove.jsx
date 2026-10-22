import Grove from './Grove.jsx';
import { useDevice } from '../store.js';
import { useEffect, useState } from 'react';

// The existing Amen hold and wording remain in Sitting. Only the chosen
// world's visual return changes: the people held in prayer share a root.
export default function AmenGrove({ people }) {
  const [light, setLight] = useState(document.documentElement.dataset.light || 'day');
  useEffect(() => { setLight(document.documentElement.dataset.light || 'day'); }, []);
  const device = useDevice();
  if (device.world !== 'grove') return null;
  return <div className="compass-amen-grove" aria-hidden="true"><Grove people={people.map((p, i) => ({ ...p, id: p.id || `held-${i}` }))} board={{ word: 'Held together', theme: 'belong' }} light={light} /></div>;
}
