import { useEffect, useMemo, useState } from 'react';
import {
  readCustomBoards, saveCustomBoard, deleteCustomBoard, encodeBoard, shareUrl,
} from '../data/customBoards.js';

// ═══════════════════════════════════════════════════════════════════
// Make a board — for yourself, or for someone else. Four questions in
// plain words, and the real pond beside the form,
// redrawn as you type. Save it to this device, or send it as a link
// (the link carries the whole board; nothing is uploaded).
// ═══════════════════════════════════════════════════════════════════

const EXAMPLE = {
  name: 'Sam',
  period: 'Autumn 2026',
  identity: {
    heroWord: 'Steady',
    statement: 'I want to be a steady presence: slow to panic, quick to listen, rooted in God.',
    values: ['Patience', 'Honesty', 'Kindness'],
    anchor: { text: 'Be still, and know that I am God.', reference: 'Psalm 46:10' },
  },
  season: {
    heroWord: 'Rest',
    sentence: 'This season is about learning to rest well, so I have something to give.',
    threads: [{ label: 'Sleep', note: 'In bed by eleven' }, { label: 'Sabbath', note: 'One day unhurried' }, { label: 'Friends', note: 'Seen weekly' }],
  },
  commitments: [
    { verb: 'Pray', text: 'Ten quiet minutes before the phone.', cadence: 'Daily' },
    { verb: 'Walk', text: 'A walk with no headphones.', cadence: 'Weekly' },
    { verb: 'Call', text: 'Ring someone I love.', cadence: 'Weekly' },
    { verb: 'Rest', text: 'Sunday afternoon kept free.', cadence: 'Weekly' },
  ],
  friction: {
    sentence: 'I say yes to everything. I want to learn to rest.',
    heroWord: 'rest',
    cadence: 'Stillness · Sabbath · Saying no',
    prayer: { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', reference: 'Matthew 11:28' },
  },
};

const BLANK = {
  name: '', period: '',
  identity: { heroWord: '', statement: '', values: [], anchor: { text: '', reference: '' } },
  season: { heroWord: '', sentence: '', threads: [] },
  commitments: [{}, {}, {}, {}],
  friction: { sentence: '', heroWord: '', cadence: '', prayer: { text: '', reference: '' } },
};

const query = (k) => { try { return new URLSearchParams(location.search).get(k); } catch { return null; } };

// Set a value deep in the draft by a path like 'identity.anchor.text'.
function setIn(obj, path, value) {
  const keys = path.split('.');
  const out = structuredClone(obj);
  let o = out;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = /^\d+$/.test(keys[i]) ? Number(keys[i]) : keys[i];
    o[k] ??= /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  }
  o[keys[keys.length - 1]] = value;
  return out;
}
const getIn = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

export default function MakeApp() {
  const editing = useMemo(() => {
    const id = query('id');
    return id ? readCustomBoards().find((b) => b.id === id) || null : null;
  }, []);
  const [draft, setDraft] = useState(() => (editing ? structuredClone(editing) : structuredClone(BLANK)));
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState('');

  const field = (path) => ({
    value: getIn(draft, path) ?? '',
    onChange: (e) => setDraft((d) => setIn(d, path, e.target.value)),
  });
  const values = (draft.identity?.values || []).join(', ');
  const ready = Boolean((draft.name || '').trim() && (draft.identity?.heroWord || '').trim());

  // The preview is the real pond, showing this board from a link.
  useEffect(() => {
    const t = setTimeout(() => setPreview(`/?board=${encodeBoard(draft)}&preview=1`), 500);
    return () => clearTimeout(t);
  }, [draft]);

  const save = () => {
    const b = saveCustomBoard({ ...draft, id: editing?.id });
    location.href = `/?member=${b.id}`;
  };
  const copy = async () => {
    const url = shareUrl(draft);
    try { await navigator.clipboard.writeText(url); } catch { window.prompt('Copy this link:', url); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const remove = () => {
    if (!editing || !window.confirm(`Delete ${editing.name}'s board from this device?`)) return;
    deleteCustomBoard(editing.id);
    location.href = '/';
  };

  return (
    <div className="mk-app">
      <nav className="mk-nav"><a href="/">← Back to the pond</a></nav>
      <div className="mk-layout">
        <form className="mk-form" onSubmit={(e) => { e.preventDefault(); if (ready) save(); }}>
          <header className="mk-head">
            <p className="mk-eyebrow">{editing ? 'Edit a board' : 'Make a board'}</p>
            <h1>Who are you becoming?</h1>
            <p className="mk-lede">
              Four short answers. They become a living board — words in the water,
              with koi that swim through them. For you, or for someone you love.
            </p>
            {!editing && (
              <button type="button" className="mk-quiet" onClick={() => setDraft(structuredClone(EXAMPLE))}>
                Fill in an example to see how it works
              </button>
            )}
          </header>

          <Section n="" title="Whose board">
            <Row label="Name" hint="Shown at the top, and in the board picker.">
              <input {...field('name')} placeholder="Sam" maxLength={40} required />
            </Row>
            <Row label="When" hint="A season or a year, so you know when to look again.">
              <input {...field('period')} placeholder="Autumn 2026" maxLength={40} />
            </Row>
          </Section>

          <Section n="01" title="Identity" sub="Who you are, at your best.">
            <Row label="One word" hint="The big word in the middle. Flourish, Steady, Brave…">
              <input {...field('identity.heroWord')} placeholder="Steady" maxLength={18} required />
            </Row>
            <Row label="In a sentence">
              <textarea {...field('identity.statement')} rows={2} maxLength={280} placeholder="I want to be a steady presence: slow to panic, quick to listen." />
            </Row>
            <Row label="Three values" hint="Separated by commas.">
              <input value={values} maxLength={80} placeholder="Patience, Honesty, Kindness"
                onChange={(e) => setDraft((d) => setIn(d, 'identity.values', e.target.value.split(',').map((s) => s.trimStart())))} />
            </Row>
            <Row label="A verse to stand on">
              <div className="mk-pair">
                <input {...field('identity.anchor.text')} placeholder="Be still, and know that I am God." maxLength={200} />
                <input {...field('identity.anchor.reference')} placeholder="Psalm 46:10" maxLength={40} className="mk-ref" />
              </div>
            </Row>
          </Section>

          <Section n="02" title="Season" sub="What this season is about. Creatures that draw near this word grow full.">
            <Row label="One word">
              <input {...field('season.heroWord')} placeholder="Rest" maxLength={18} />
            </Row>
            <Row label="In a sentence">
              <textarea {...field('season.sentence')} rows={2} maxLength={240} placeholder="Learning to rest well, so I have something to give." />
            </Row>
            <Row label="Three threads" hint="Short: a word, and what it means for you." group>
              {[0, 1, 2].map((i) => (
                <div className="mk-pair" key={i}>
                  <input {...field(`season.threads.${i}.label`)} placeholder={['Sleep', 'Sabbath', 'Friends'][i]} maxLength={30} className="mk-ref" />
                  <input {...field(`season.threads.${i}.note`)} placeholder={['In bed by eleven', 'One day unhurried', 'Seen weekly'][i]} maxLength={60} />
                </div>
              ))}
            </Row>
          </Section>

          <Section n="03" title="Commitments" sub="Up to four small things you'll actually do. Each becomes a lily pad (or a cloud).">
            {[0, 1, 2, 3].map((i) => (
              <div className="mk-commit" key={i}>
                <input {...field(`commitments.${i}.verb`)} placeholder={['Pray', 'Walk', 'Call', 'Rest'][i]} maxLength={16} className="mk-verb" aria-label={`Commitment ${i + 1}: a verb`} />
                <input {...field(`commitments.${i}.text`)} placeholder={['Ten quiet minutes before the phone.', 'A walk with no headphones.', 'Ring someone I love.', 'Sunday afternoon kept free.'][i]} maxLength={140} aria-label={`Commitment ${i + 1}: what`} />
                <input {...field(`commitments.${i}.cadence`)} placeholder={i ? 'Weekly' : 'Daily'} maxLength={16} className="mk-cad" aria-label={`Commitment ${i + 1}: how often`} />
              </div>
            ))}
          </Section>

          <Section n="04" title="Friction" sub="Where it's hard. Creatures that pass close take this word's colour.">
            <Row label="The honest sentence" hint="Put the word you choose below somewhere in it.">
              <textarea {...field('friction.sentence')} rows={2} maxLength={200} placeholder="I say yes to everything. I want to learn to rest." />
            </Row>
            <Row label="Its one word">
              <input {...field('friction.heroWord')} placeholder="rest" maxLength={18} />
            </Row>
            <Row label="Practices" hint="What helps, separated by ·">
              <input {...field('friction.cadence')} placeholder="Stillness · Sabbath · Saying no" maxLength={60} />
            </Row>
            <Row label="A prayer for it">
              <div className="mk-pair">
                <input {...field('friction.prayer.text')} placeholder="Come to me, all you who are weary…" maxLength={240} />
                <input {...field('friction.prayer.reference')} placeholder="Matthew 11:28" maxLength={40} className="mk-ref" />
              </div>
            </Row>
          </Section>

          <div className="mk-actions">
            <button type="submit" className="mk-primary" disabled={!ready}>
              {editing ? 'Save and open' : 'Save to this device and open'}
            </button>
            <button type="button" onClick={copy} disabled={!ready}>{copied ? 'Link copied' : 'Copy a link to send'}</button>
            {editing && <button type="button" className="mk-danger" onClick={remove}>Delete</button>}
            {!ready && <p className="mk-need">Add a name and one word to save.</p>}
            <p className="mk-note">
              A link carries the whole board, so whoever opens it sees it straight away and can keep it.
              Nothing is uploaded anywhere.
            </p>
          </div>
        </form>

        <aside className="mk-preview" aria-label="Preview">
          <p className="mk-eyebrow">Live preview</p>
          <div className="mk-frame">
            {preview && <iframe title="Preview of the board" src={preview} />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ n, title, sub, children }) {
  return (
    <fieldset className="mk-section">
      <legend>{n && <span className="mk-n">{n}</span>}{title}</legend>
      {sub && <p className="mk-sub">{sub}</p>}
      {children}
    </fieldset>
  );
}

function Row({ label, hint, group = false, children }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className="mk-row">
      <span className="mk-label">{label}</span>
      {children}
      {hint && <span className="mk-hint">{hint}</span>}
    </Tag>
  );
}
