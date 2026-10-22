import { useState } from 'react';
import { ADULT_DOWN, CHILD_DOWN } from './model.js';

function cardsFor({ pairNames, voice, liturgy, verse }) {
  const cards = [];
  if (voice === 'silent') cards.push({ kind: 'still', text: 'Be still.' });
  cards.push({
    kind: 'hold',
    text: liturgy === 'sunday' ? 'The whole household.' : `Holding ${pairNames}.`,
  });
  verse.clauses.forEach((text, i) => {
    cards.push({ kind: 'verse', text, ref: i === 0 });
  });
  const who = liturgy === 'sunday' ? 'this household' : pairNames;
  cards.push({
    kind: 'ask',
    text: voice === 'silent' ? `Let this word rest on ${who} today.` : `God, be near ${who} today.`,
  });
  cards.push({ kind: 'down' });
  return cards;
}

export default function Pray({
  verse, pairNames, voice, liturgy, withChildren, startAt, onClose, onAmen, onFall,
}) {
  const cards = cardsFor({ pairNames, voice, liturgy, verse });
  const start = startAt === 'down' ? cards.findIndex((c) => c.kind === 'down') : 0;
  const [index, setIndex] = useState(Math.max(0, start));
  const [putDown, setPutDown] = useState(null);
  const [ended, setEnded] = useState(false);
  const card = cards[index];
  const onward = voice === 'silent' ? 'On' : 'Next';

  function next() {
    if (index < cards.length - 1) setIndex(index + 1);
    else {
      onAmen(putDown);
      setEnded(true);
    }
  }

  if (ended) {
    return (
      <div className="screen">
        <div className="sheet">
          <div className="card">
            <p className="still">Amen.</p>
            <p className="sat-line">
              {withChildren ? 'The words can fall next.' : 'The others can pray this later.'}
            </p>
          </div>
          <div className="actions">
            {withChildren ? (
              <>
                <button className="primary" type="button" onClick={onFall}>Let the words fall</button>
                <button className="quiet" type="button" onClick={onClose}>Back to the table</button>
              </>
            ) : (
              <>
                <button className="primary" type="button" onClick={onClose}>That is enough</button>
                <button className="quiet" type="button" onClick={onFall}>Let the words fall</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="sheet">
        <div className="bar">
          <button className="quiet" type="button" onClick={onClose}>Close</button>
          <span className="dots" aria-hidden="true">
            {cards.map((c, i) => <i key={c.kind + i} className={i === index ? 'on' : ''} />)}
          </span>
        </div>
        <div className="card" key={index}>
          {card.kind === 'still' && (
            <>
              <p className="still">{card.text}</p>
              <p className="hint">When you are ready.</p>
            </>
          )}
          {card.kind === 'hold' && <p className="names">{card.text}</p>}
          {card.kind === 'verse' && (
            <>
              <p className="verse-line">{card.text}</p>
              {card.ref && <p className="ref">{verse.ref} · NIV</p>}
            </>
          )}
          {card.kind === 'ask' && <p className="prayer-line">{card.text}</p>}
          {card.kind === 'down' && (
            withChildren ? (
              <ChildDown value={putDown} onChange={setPutDown} />
            ) : (
              <AdultDown value={putDown} onChange={setPutDown} />
            )
          )}
        </div>
        <div className="actions">
          <button className="primary" type="button" onClick={next}>
            {index === cards.length - 1 ? 'Amen' : onward}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdultDown({ value, onChange }) {
  return (
    <>
      <p className="prayer-line">What got in the way?</p>
      <div className="choices">
        {ADULT_DOWN.map((word) => (
          <button
            key={word}
            type="button"
            className={value === word ? 'word on' : 'word'}
            onClick={() => onChange(word)}
          >
            {word}
          </button>
        ))}
      </div>
      <button className="quiet" type="button" onClick={() => onChange(null)}>Leave it unsaid</button>
    </>
  );
}

function ChildDown({ value, onChange }) {
  return (
    <>
      <p className="prayer-line">I wonder what is heavy.</p>
      <div className="stones">
        {CHILD_DOWN.map((word) => (
          <button
            key={word}
            type="button"
            className={value === word ? 'stone on' : 'stone'}
            onClick={() => onChange(word)}
          >
            <span className="pebble" aria-hidden="true" />
            {word}
          </button>
        ))}
      </div>
      <div className="wall" aria-hidden="true" />
      <button className="quiet" type="button" onClick={() => onChange(null)}>Nothing today</button>
    </>
  );
}
