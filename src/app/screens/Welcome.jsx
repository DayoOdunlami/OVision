import { go } from '../route.js';

// ═══════════════════════════════════════════════════════════════════
// Welcome — a fresh device, or another family opening it for the first
// time. A clear pond with a few koi, one line, and two doors.
// ═══════════════════════════════════════════════════════════════════

export default function Welcome() {
  return (
    <main className="welcome" aria-label="Welcome">
      <div className="welcome-card">
        <p className="label">Quiet Waters</p>
        <h1 className="welcome-title">A few minutes each day to pray for each other, from Scripture.</h1>
        <p className="welcome-sub">
          For a household: a prayer each day for two of you, a verse to learn by heart in play, and a pond that fills over the season.
        </p>
        <div className="welcome-actions">
          <button className="btn btn-primary btn-big" onClick={() => go('setup')}>Set up our household</button>
          <button className="btn btn-secondary btn-big" onClick={() => { window.location.href = '/?demo=1'; }}>
            Look around with an example family
          </button>
        </div>
        <p className="welcome-note">
          No account. Nothing leaves this device. Set up on another phone already? Open the link it gave you here.
        </p>
      </div>
    </main>
  );
}
