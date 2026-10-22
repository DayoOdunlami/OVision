import { useState } from 'react';
import { go, home } from '../route.js';
import { useDevice, setDevice, setState, useStore, isDemo, forgetDemo, currentSeason } from '../store.js';
import { shareLink } from '../household.js';
import { prayers } from '../content/prayers.js';
import { VERSES, NIV_NOTICE } from '../content/verses.js';
import { ROTATION } from '../rota.js';
import { CloseButton, KoiGlyph } from '../ui.jsx';

// ═══════════════════════════════════════════════════════════════════
// Settings — the few things worth a setting. Everything about *how* to
// pray is worked out from who's in the room, so it isn't here.
// ═══════════════════════════════════════════════════════════════════

const SIZES = [
  { v: 1, label: '100%' },
  { v: 1.25, label: '125%' },
  { v: 1.5, label: '150%' },
  { v: 2, label: '200%' },
];

export default function Settings({ day }) {
  const state = useStore();
  const device = useDevice();
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const install = window.__installPrompt;
  const [installed, setInstalled] = useState(window.matchMedia?.('(display-mode: standalone)').matches);

  const makeLink = async () => {
    const url = shareLink(state.household, currentSeason(state));
    setLink(url);
    try {
      if (navigator.share) await navigator.share({ title: 'Quiet Waters', text: 'Our household, for Quiet Waters', url });
      else { await navigator.clipboard.writeText(url); setCopied(true); }
    } catch { /* the link is shown below to copy by hand */ }
  };

  const pickPrayer = (idx) => setState((s) => ({ ...s, pick: idx == null ? null : { week: day.week, prayer: idx } }));

  return (
    <div className="room room-paper settings" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="room-top"><span /><CloseButton onClick={home} /></div>
      <div className="room-body scroll">
        <h1 className="room-title">Settings</h1>

        <section className="set">
          <h2 className="section-title">Our household</h2>
          <div className="set-people">
            {day.people.map((p) => (
              <span key={p.id} className="here-name small"><KoiGlyph koi={p.koi} size={28} /><b>{p.name}</b></span>
            ))}
          </div>
          <button className="btn btn-secondary" onClick={() => go('setup')}>Change who lives here</button>
        </section>

        <section className="set">
          <h2 className="section-title">This week’s prayer</h2>
          <p className="room-sub">It changes every Monday morning, as a small surprise. You can choose this week’s instead.</p>
          <select
            className="field"
            value={state.pick?.week === day.week ? state.pick.prayer : ''}
            onChange={(e) => pickPrayer(e.target.value === '' ? null : Number(e.target.value))}
            aria-label="This week's prayer"
          >
            <option value="">A surprise ({VERSES[day.prayerIdx].ref})</option>
            {ROTATION.map((idx) => (
              <option key={idx} value={idx}>{prayers[idx].ref} · {VERSES[idx].word}</option>
            ))}
          </select>
        </section>

        <section className="set">
          <h2 className="section-title">This device</h2>
          <p className="set-label">Text size</p>
          <div className="seg" role="radiogroup" aria-label="Text size">
            {SIZES.map((s) => (
              <button key={s.v} role="radio" aria-checked={device.textScale === s.v} className={'seg-opt' + (device.textScale === s.v ? ' is-on' : '')}
                onClick={() => setDevice((d) => ({ ...d, textScale: s.v }))}>{s.label}</button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={Boolean(device.keepAwake)} onChange={(e) => setDevice((d) => ({ ...d, keepAwake: e.target.checked }))} />
            <span>
              <b>Keep the screen on</b>
              <small>For a tablet on the side: the pond stays awake, showing the family’s word and today.</small>
            </span>
          </label>
          {!installed && (
            install ? (
              <button className="btn btn-secondary" onClick={async () => { install.prompt(); const r = await install.userChoice; if (r?.outcome === 'accepted') setInstalled(true); }}>
                Put Quiet Waters on the home screen
              </button>
            ) : (
              <p className="room-sub">To put Quiet Waters on the home screen: in Chrome, open the menu (⋮) and choose “Add to Home screen”.</p>
            )
          )}
        </section>

        <section className="set">
          <h2 className="section-title">Another phone or tablet</h2>
          <p className="room-sub">Send a link, and open it on the other device. Both will show the same prayer each day. Nothing goes to a server.</p>
          <button className="btn btn-secondary" onClick={makeLink}>Make a link for another device</button>
          {link && (
            <p className="link-out">
              {copied ? 'Copied. ' : ''}<input className="field small" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link for another device" />
            </p>
          )}
        </section>

        <section className="set">
          <h2 className="section-title">On paper</h2>
          <p className="room-sub">A card for the bedside or the fridge: this week’s verse, who we pray for each day, and the prayer.</p>
          <button className="btn btn-secondary" onClick={() => go('print')}>Print this week’s card</button>
        </section>

        <section className="set about">
          <h2 className="section-title">About</h2>
          <p className="room-sub">No account, no tracking, no notifications. Everything stays on this device.</p>
          <p className="niv">{NIV_NOTICE}</p>
          <p className="niv">Prayers, prompts and notes are original modern renderings. The koi are drawn in code. Fonts: Fraunces and Literata (SIL Open Font Licence).</p>
          <p className="niv">Version {typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev'}</p>
          {isDemo && (
            <button className="btn btn-secondary" onClick={() => { forgetDemo(); window.location.href = '/'; }}>Leave the example family</button>
          )}
        </section>
      </div>
    </div>
  );
}
