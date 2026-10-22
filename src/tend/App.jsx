import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  STORAGE_KEY,
  loadModel,
  saveModel,
  freshModel,
  demoModel,
  dateKey,
  weekFor,
  pairFor,
  recordSitting,
  recordPractice,
} from "./model.js";
const GardenArtwork = lazy(() => import("./GardenScene.jsx"));
const VersePlay = lazy(() => import("./VersePlay.jsx"));
import "./tokens.css";
import "./tend.css";

const originalParams = new URLSearchParams(location.search);
const routeAliases = {
  "/pray/": "prayer",
  "/flourish/abide/": "release",
  "/flourish/": "garden",
  "/murmuration/": "garden",
  "/make/": "season",
  "/today/": "today",
  "/admin/": "household",
  "/labs/": "household",
};
const currentView = () =>
  new URLSearchParams(location.search).get("view") ||
  (new URLSearchParams(location.search).has("screen")
    ? "rest"
    : routeAliases[location.pathname]) ||
  "today";
const listNames = (names) =>
  names.length < 3
    ? names.join(" & ")
    : `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
const shortDate = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
function rememberedPeople(mode, members) {
  try {
    const saved = JSON.parse(sessionStorage.getItem("tend.people." + mode));
    const ids = Array.isArray(saved)
      ? saved.filter((id) => members.some((p) => p.id === id))
      : [];
    if (ids.length) return mode === "solo" ? ids.slice(0, 1) : ids;
  } catch {}
  return mode === "solo"
    ? members.slice(0, 1).map((p) => p.id)
    : members.map((p) => p.id);
}
function previewDate() {
  const d = new Date();
  if (originalParams.get("day") === "sunday")
    d.setDate(d.getDate() - d.getDay());
  return d;
}
const initialDate = previewDate();
const initialHour = originalParams.has("h")
  ? Number(originalParams.get("h"))
  : new Date().getHours();

const colors = [
  "#b36a40",
  "#738b78",
  "#be9b48",
  "#758b9c",
  "#b88383",
  "#8b7a9b",
];
function initialModel() {
  let data = loadModel();
  if (originalParams.get("demo") === "1" && !data.household.members.length) {
    data = demoModel();
    saveModel(data);
  }
  return data;
}

export function BranchMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M13 43C17 32 21 19 30 5M20 27C8 27 4 19 6 13c10 0 15 5 14 14ZM25 18c-1-10 3-16 12-17 2 9-2 15-12 17ZM15 36c-9 2-14-2-14-9 8-1 13 2 14 9ZM20 29c9-9 15-9 19-6-3 8-10 10-19 6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function GardenScene(props) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 120);
    return () => clearTimeout(timer);
  }, []);
  return ready ? (
    <Suspense
      fallback={
        <div className="garden-scene art-placeholder" aria-hidden="true" />
      }
    >
      <GardenArtwork {...props} />
    </Suspense>
  ) : (
    <div className="garden-scene art-placeholder" aria-hidden="true" />
  );
}
function Arrow() {
  return (
    <svg
      className="arrow"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function People({ members, selected, onChange, label = "Who’s here?" }) {
  return (
    <fieldset className="people-field">
      <legend>{label}</legend>
      <div className="people">
        {members.map((person) => (
          <button
            key={person.id}
            type="button"
            aria-pressed={selected.includes(person.id)}
            onClick={() =>
              onChange(
                selected.includes(person.id)
                  ? selected.filter((id) => id !== person.id)
                  : [...selected, person.id],
              )
            }
          >
            <span className="person-dot" style={{ background: person.color }} />
            {person.name}
            <span className="person-check" aria-hidden="true">
              {selected.includes(person.id) ? "✓" : "+"}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function App() {
  const [model, setModel] = useState(initialModel);
  const [hour, setHour] = useState(initialHour);
  const night = hour < 7 || hour >= 20;
  const [view, setView] = useState(currentView);
  const pendingSave = useRef(false);
  const currentModel = useRef(model);
  currentModel.current = model;
  const [sittingDate, setSittingDate] = useState(initialDate);
  const [mode, setMode] = useState(
    originalParams.get("mode") === "together" ? "together" : "solo",
  );
  const [who, setWho] = useState(() => {
    const m = initialModel();
    return rememberedPeople(
      originalParams.get("mode") === "together" ? "together" : "solo",
      m.household.members,
    );
  });
  const [step, setStep] = useState(() =>
    Math.max(0, Math.min(6, Number(originalParams.get("step")) || 0)),
  );
  const [finished, setFinished] = useState(false);
  const [playReady, setPlayReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [installEvent, setInstallEvent] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [liveDate, setLiveDate] = useState(initialDate);
  const today = ["prayer", "play"].includes(view) ? sittingDate : liveDate;
  const isSunday = today.getDay() === 0;
  const members = model.household.members;
  const verse = weekFor(today);
  const pair = pairFor(today, members);
  const pairNames = listNames(pair.map((p) => p.name));
  const participants = who.filter((id) => members.some((p) => p.id === id));
  const participantNames = listNames(
    members.filter((p) => participants.includes(p.id)).map((p) => p.name),
  );
  const hasFamily = members.length > 0;
  const isPractice = view === "prayer" || view === "play" || view === "release";
  const actualView = !hasFamily && view !== "household" ? "welcome" : view;
  function update(next) {
    setModel(next);
    const ok = saveModel(next);
    pendingSave.current = !ok;
    setStorageError(!ok);
  }
  function go(next, extra = {}) {
    if (["prayer", "play"].includes(next) && !["prayer", "play"].includes(view))
      setSittingDate(liveDate);
    const q = new URLSearchParams(location.search);
    q.delete("step");
    q.delete("screen");
    q.set("view", next);
    for (const [k, v] of Object.entries(extra))
      v == null ? q.delete(k) : q.set(k, v);
    history.pushState({}, "", `/?${q}`);
    setView(next);
    setStep(0);
    setFinished(false);
    setPlayReady(false);
    setShowHelp(false);
    window.scrollTo(0, 0);
  }
  function startPrayer(nextMode) {
    setMode(nextMode);
    setWho(rememberedPeople(nextMode, members));
    go("prayer", { mode: nextMode });
  }
  function nextStep(n) {
    setStep(n);
    const q = new URLSearchParams(location.search);
    q.set("step", n);
    history.replaceState({}, "", `/?${q}`);
    window.scrollTo(0, 0);
  }
  function complete() {
    update(
      recordSitting(model, {
        date: today,
        participants,
        mode,
        verseId: verse.id,
      }),
    );
    setFinished(true);
    window.scrollTo(0, 0);
  }
  function practiceComplete() {
    update(
      recordPractice(model, { date: today, participants, verseId: verse.id }),
    );
  }
  function useDemo() {
    const d = demoModel();
    update(d);
    setWho(d.household.members.slice(0, 1).map((p) => p.id));
    go("today");
  }
  useEffect(() => {
    document.body.dataset.theme = night ? "night" : "day";
    const back = () => {
      setView(currentView());
      const p = new URLSearchParams(location.search);
      setStep(Number(p.get("step")) || 0);
      const restoredMode = p.get("mode") === "together" ? "together" : "solo";
      setMode(restoredMode);
      setWho(
        rememberedPeople(restoredMode, currentModel.current.household.members),
      );
      setFinished(false);
      setPlayReady(false);
    };
    addEventListener("popstate", back);
    const install = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    addEventListener("beforeinstallprompt", install);
    return () => {
      removeEventListener("popstate", back);
      removeEventListener("beforeinstallprompt", install);
    };
  }, []);
  useEffect(() => {
    if (view === "prayer" && !finished)
      document.querySelector(".prayer-leaf")?.focus({ preventScroll: true });
  }, [view, step, finished]);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "tend.people." + mode,
        JSON.stringify(participants),
      );
    } catch {}
  }, [who, mode]);
  useEffect(() => {
    const sync = (e) => {
      if (e.key === STORAGE_KEY && !pendingSave.current) setModel(loadModel());
    };
    const tick = () => {
      setLiveDate(previewDate());
      if (!originalParams.has("h")) setHour(new Date().getHours());
    };
    const resume = () => {
      if (document.visibilityState === "visible") {
        tick();
        if (!pendingSave.current) setModel(loadModel());
      }
    };
    const timer = setInterval(tick, 60000);
    addEventListener("storage", sync);
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearInterval(timer);
      removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);
  useEffect(() => {
    document.body.dataset.theme = night ? "night" : "day";
  }, [night]);
  useEffect(() => {
    document.title = `${actualView === "welcome" ? "Welcome" : actualView === "today" ? "Today" : actualView === "prayer" ? "Pray" : actualView === "season" ? "Our season" : actualView === "garden" ? "Our garden" : actualView === "play" ? "Verse play" : actualView === "release" ? "Letting go" : "Tend"} · Tend`;
  }, [actualView]);
  const prayed = model.sessions.filter((s) => s.date === dateKey(today));
  const soloToday = prayed.some((s) => s.mode === "solo");
  const togetherToday = prayed.some((s) => s.mode === "together");
  const presentVerse = (
    <>
      <span className="eyebrow">THIS WEEK’S SCRIPTURE</span>
      <p className="weekly-ref">
        {verse.ref} <span>NIV</span>
      </p>
    </>
  );
  return (
    <div className={`book ${view === "rest" ? "rest-book" : ""}`}>
      {view !== "rest" && (
        <header className="masthead">
          <button
            className="wordmark"
            onClick={() => go("today")}
            aria-label="Tend home"
          >
            <BranchMark />
            tend<span className="wordmark-note">Scripture, held together.</span>
          </button>
          {!isPractice && hasFamily ? (
            <nav aria-label="Main navigation">
              {[
                ["today", "Today"],
                ["garden", "Our garden"],
                ["season", "Our season"],
              ].map(([key, title]) => (
                <button
                  key={key}
                  aria-current={actualView === key ? "page" : undefined}
                  onClick={() => go(key)}
                >
                  {title}
                </button>
              ))}
            </nav>
          ) : isPractice ? (
            <button className="text-button" onClick={() => go("today")}>
              Close <span aria-hidden="true">×</span>
            </button>
          ) : (
            <span className="mast-note">A household prayer book</span>
          )}
        </header>
      )}
      {storageError && (
        <div role="alert" className="storage-alert">
          This browser couldn’t save your changes. Keep this page open, or allow
          site storage before closing it.{" "}
          <button
            onClick={() => {
              const ok = saveModel(model);
              pendingSave.current = !ok;
              setStorageError(!ok);
            }}
          >
            Try saving again
          </button>
        </div>
      )}
      {actualView === "welcome" && (
        <main className="welcome spread">
          <div className="welcome-copy">
            <span className="eyebrow">A SMALL PRACTICE. A SHARED LIFE.</span>
            <h1>
              A little space.
              <br />
              For <em>your people.</em>
            </h1>
            <p className="lede">
              Pray Scripture. Learn it by heart.
              <br />
              Let it take root in everyday life.
            </p>
            <div className="welcome-actions">
              <button
                className="button primary"
                onClick={() => go("household")}
              >
                Make it yours <Arrow />
              </button>
              <button className="button secondary" onClick={useDemo}>
                Explore a household <Arrow />
              </button>
            </div>
            <p className="small muted">
              No account. Just this device, and the people you bring.
            </p>
          </div>
          <div className="welcome-art">
            <GardenScene compact night={night} />
            <span className="art-caption">
              A place to return. Nothing to catch up on.
            </span>
          </div>
        </main>
      )}
      {actualView === "today" && (
        <main className="today-page">
          <div className="day-line">
            <span>
              {today.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </span>
            <button onClick={() => go("household")}>
              {model.household.name} <Arrow />
            </button>
          </div>
          <section className="today-spread">
            <div className="daily-copy">
              <span className="eyebrow accent">
                {isSunday
                  ? "SUNDAY · ALL OF US"
                  : hour < 12
                    ? "A QUIET BEGINNING"
                    : hour >= 17
                      ? "ROOM AT THE TABLE"
                      : "A MOMENT IN THE DAY"}
              </span>
              <h1>
                A little room.
                <br />
                For what <em>matters.</em>
              </h1>
              <div className="dedication">
                <span className="small muted">
                  {isSunday
                    ? "Today, we bring the whole household before God."
                    : "Today, we’re praying for"}
                </span>
                <h2>
                  {isSunday ? (
                    "All of us."
                  ) : (
                    <>
                      {pairNames}
                      <span className="accent">.</span>
                    </>
                  )}
                </h2>
              </div>
              <div className="daily-actions">
                <button
                  className="button primary"
                  onClick={() => startPrayer("solo")}
                >
                  Pray quietly{" "}
                  <span className="action-detail">on your own</span>
                  <Arrow />
                </button>
                <button
                  className="button secondary"
                  onClick={() => startPrayer("together")}
                >
                  Gather & pray{" "}
                  <span className="action-detail">with each other</span>
                  <Arrow />
                </button>
              </div>
              {prayed.length > 0 ? (
                <p className="sitting-note">
                  <span aria-hidden="true">✓</span>{" "}
                  {soloToday && togetherToday
                    ? "Quiet and shared prayer have found a place today."
                    : soloToday
                      ? "A quiet prayer has been offered today. There’s still room to gather."
                      : "You’ve shared a prayer today. You’re welcome to return quietly."}
                </p>
              ) : (
                <p className="sitting-note">
                  One prayer. Meet it quietly, or meet it together.
                </p>
              )}
            </div>
            <div className="daily-garden">
              <div className="garden-corner">
                <span className="eyebrow">OUR LITTLE CORNER</span>
                <span>{model.board.season}</span>
              </div>
              <GardenScene
                compact
                season={model.board.season}
                night={night}
                planted={model.sessions.length}
              />
              <div className="garden-foot">
                <span>
                  <i>Our shared word</i> {model.board.word}
                </span>
                <button
                  className="text-button"
                  onClick={() => go("garden")}
                  aria-label="Visit our garden"
                >
                  Visit the garden <Arrow />
                </button>
              </div>
            </div>
          </section>
          <section className="weekly-strip">
            <div className="weekly-label">
              <span className="chapter-number">01</span>
              <div>
                {presentVerse}
                <span className="small muted">A new verse each Monday.</span>
              </div>
            </div>
            <blockquote>“{verse.text}”</blockquote>
            <button
              className="text-button play-link"
              onClick={() => {
                setWho(members.map((p) => p.id));
                go("play");
              }}
            >
              Play with the verse <Arrow />
            </button>
          </section>
          <div className="quiet-links">
            <button onClick={() => go("release")}>
              <span className="small muted">BEFORE YOU CARRY ON</span>
              <span>
                Something to let go of? <Arrow />
              </span>
            </button>
            <span className="small muted">
              Come as you are. Leave when you’re ready.
            </span>
          </div>
          {model.demo && (
            <p className="demo-note">
              You’re visiting a fictional household.{" "}
              <button onClick={() => go("household")}>
                Make this place yours <Arrow />
              </button>
            </p>
          )}
        </main>
      )}
      {actualView === "prayer" && (
        <main className="practice-page" key={`prayer-${mode}`}>
          {!finished ? (
            <>
              <div className="practice-top">
                <span className="eyebrow">
                  {mode === "solo" ? "QUIET PRAYER" : "PRAYING TOGETHER"}
                </span>
                <span className="small muted">
                  {isSunday ? "For all of us" : `For ${pairNames}`}
                </span>
              </div>
              <div
                className="practice-progress"
                aria-label={`Step ${step + 1} of 7`}
              >
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className={i <= step ? "reached" : ""} />
                ))}
              </div>
              <div className="prayer-leaf" key={step} tabIndex={-1}>
                {step === 0 && (
                  <>
                    <span className="eyebrow accent">ARRIVE</span>
                    <h1>
                      Be here.
                      <br />
                      <em>That’s enough to begin.</em>
                    </h1>
                    <p className="practice-intro">
                      Put down what you can.
                      <br />
                      Take one unhurried breath.
                      <br />
                      God is already here.
                    </p>
                    {mode === "together" ? (
                      <People
                        members={members}
                        selected={participants}
                        onChange={setWho}
                      />
                    ) : (
                      <label className="solo-person">
                        Praying as{" "}
                        <select
                          value={participants[0] || ""}
                          onChange={(e) => setWho([e.target.value])}
                        >
                          {members.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <p className="small muted">
                      {mode === "together"
                        ? "Choose the people praying in this sitting."
                        : "This quiet sitting belongs to you. Others can pray later."}
                    </p>
                  </>
                )}
                {step === 1 && (
                  <>
                    <span className="eyebrow accent">
                      READ SLOWLY · {verse.word.toUpperCase()}
                    </span>
                    <p className="scripture-verse">{verse.text}</p>
                    <p className="verse-citation">{verse.ref} · NIV</p>
                    <p className="practice-intro">
                      {mode === "together"
                        ? "One person reads. Listen for a word that stays with you."
                        : "Read it again. Let one word stay with you."}
                    </p>
                  </>
                )}
                {step >= 2 && step <= 4 && (
                  <>
                    <span className="eyebrow accent">
                      BRING YOUR PEOPLE BEFORE GOD
                    </span>
                    <p className="prayer-text">
                      {verse.prayer[step - 2].replaceAll("{names}", pairNames)}
                    </p>
                    <p className="small muted prayer-margin">
                      Pause wherever the words become your own prayer.
                    </p>
                  </>
                )}
                {step === 5 && (
                  <>
                    <span className="eyebrow accent">MAKE ROOM TO RESPOND</span>
                    <h1 className="wonder-heading">{verse.wonder}</h1>
                    <p className="practice-intro">
                      {mode === "together"
                        ? "You can each say a little, or simply be quiet together."
                        : "Tell God what comes to mind, or simply sit with him."}
                    </p>
                    <p className="small muted">
                      There’s nothing to type. This moment is yours.
                    </p>
                  </>
                )}
                {step === 6 && (
                  <>
                    <span className="eyebrow accent">CARRY IT WITH YOU</span>
                    <h1>
                      Let this prayer
                      <br />
                      <em>become a way of living.</em>
                    </h1>
                    <p className="practice-intro">{verse.carry}</p>
                    <p className="prayer-text blessing">
                      God, keep us in your love.
                      <br />
                      Help us offer it to one another.
                      <br />
                      Through Jesus Christ.
                    </p>
                  </>
                )}
              </div>
              <div className="practice-actions">
                {step > 0 ? (
                  <button
                    className="text-button"
                    onClick={() => nextStep(step - 1)}
                  >
                    ← Back
                  </button>
                ) : (
                  <span className="small muted">
                    {mode === "solo"
                      ? "About five quiet minutes"
                      : "Take the time you need"}
                  </span>
                )}
                <button
                  className="button primary"
                  disabled={!participants.length}
                  onClick={() => (step === 6 ? complete() : nextStep(step + 1))}
                >
                  {step === 0
                    ? "Begin"
                    : step === 1
                      ? "Pray for them"
                      : step === 5
                        ? "Carry it with you"
                        : step === 6
                          ? "Amen"
                          : "Continue"}{" "}
                  <Arrow />
                </button>
              </div>
            </>
          ) : (
            <div className="prayer-ending">
              <BranchMark />
              <h1>
                Amen<span className="accent">.</span>
              </h1>
              <p className="lede">
                {participantNames}, take these words
                <br />
                into the rest of your day.
              </p>
              <p className="small muted">
                {mode === "solo"
                  ? "Your quiet prayer is saved. The household can gather later."
                  : "This sitting is saved for the people who were here."}
              </p>
              <div className="ending-actions">
                <button
                  className="button primary"
                  onClick={() => {
                    go("play");
                    setPlayReady(true);
                  }}
                >
                  Play with the verse <Arrow />
                </button>
                <button
                  className="button secondary"
                  onClick={() => go("garden")}
                >
                  Rest in the garden <Arrow />
                </button>
                <button className="text-button" onClick={() => go("today")}>
                  Back to Today
                </button>
              </div>
            </div>
          )}
        </main>
      )}
      {actualView === "play" &&
        (playReady ? (
          <Suspense
            fallback={
              <main className="practice-page">
                <h1>A moment for the words.</h1>
                <p role="status">Opening the verse…</p>
              </main>
            }
          >
            <VersePlay
              verse={verse}
              onClose={() => go("today")}
              onComplete={practiceComplete}
            />
          </Suspense>
        ) : (
          <main className="practice-page game-welcome">
            <span className="eyebrow accent">LEARN IT BY HEART</span>
            <h1>
              Let the words fall.
              <br />
              <em>Find them together.</em>
            </h1>
            <p className="lede">
              The same verse you pray, all week.
              <br />
              No race. No score. Have another go.
            </p>
            <People
              members={members}
              selected={participants}
              onChange={setWho}
              label="Who’s playing?"
            />
            <div className="game-start">
              <p className="small muted">
                {verse.ref} · NIV · {verse.word}
              </p>
              <button
                className="button primary"
                disabled={!participants.length}
                onClick={() => setPlayReady(true)}
              >
                Play with the verse <Arrow />
              </button>
            </div>
          </main>
        ))}
      {actualView === "release" && <Release onDone={() => go("today")} />}
      {actualView === "garden" && (
        <main className="garden-page">
          <div className="section-heading">
            <div>
              <span className="eyebrow accent">OUR GARDEN</span>
              <h1>
                Good things
                <br />
                <em>take time.</em>
              </h1>
            </div>
            <div className="section-aside">
              <p>
                A place to rest your eyes.
                <br />A few pages of the life you’ve shared.
              </p>
              <button className="text-button" onClick={() => go("rest")}>
                Leave the garden open <Arrow />
              </button>
            </div>
          </div>
          <div className="wide-garden">
            <GardenScene
              interactive
              night={night}
              planted={model.sessions.length}
              season={model.board.season}
            />
            <div className="garden-inscription">
              <span className="eyebrow">OUR WORD FOR THIS SEASON</span>
              <span>{model.board.word}</span>
            </div>
          </div>
          <Journal model={model} />
        </main>
      )}
      {actualView === "rest" && (
        <Rest
          board={model.board}
          night={night}
          sessions={model.sessions.length}
          onDone={() => go("garden")}
        />
      )}
      {actualView === "season" && (
        <Season model={model} onSave={update} night={night} />
      )}
      {actualView === "household" && (
        <Household
          model={model}
          onSave={(next) => {
            update(next);
            setWho(next.household.members.slice(0, 1).map((p) => p.id));
            go("today");
          }}
          onDemo={useDemo}
        />
      )}
      {!isPractice && view !== "rest" && (
        <footer className="colophon">
          <span>
            <BranchMark />A little, with love.
          </span>
          <div>
            <button onClick={() => go("household")}>Your household</button>
            <button
              onClick={async () => {
                if (installEvent) {
                  await installEvent.prompt();
                  setInstallEvent(null);
                } else setShowHelp(!showHelp);
              }}
            >
              Keep Tend close <Arrow />
            </button>
            <button
              onClick={() =>
                setShowHelp(showHelp === "about" ? false : "about")
              }
            >
              About & Scripture
            </button>
          </div>
        </footer>
      )}
      {showHelp && (
        <div
          className="info-panel"
          role="region"
          aria-label={
            showHelp === "about" ? "About Tend" : "Add to home screen"
          }
        >
          <button
            className="info-close"
            aria-label="Close information"
            onClick={() => setShowHelp(false)}
          >
            ×
          </button>
          {showHelp === "about" ? (
            <>
              <h2>Scripture, held together.</h2>
              <p>
                Tend is a small household prayer book. Your household, season
                and dated sittings stay in this browser on this device. There is
                no account or cross-device sync. Clearing site data clears this
                book.
              </p>
              <p>
                Prayer is an invitation, not a measure of faith. A saved sitting
                says who prayed here; a practised verse says you played with its
                words. Neither is a score of your life with God.
              </p>
              <p>
                Scripture quotations taken from The Holy Bible, New
                International Version®, NIV®. Copyright © 1973, 1978, 1984,
                2011 by Biblica, Inc. Used with permission. All rights reserved
                worldwide.
              </p>
              <p>
                Original prayers and reflections surround eight short NIV
                verses. The verse is the same in prayer and play. A new verse
                arrives each Monday; Sunday closes that week.
              </p>
            </>
          ) : (
            <>
              <h2>A small place on your home screen.</h2>
              <p>
                In Chrome on Android, open the browser menu and choose{" "}
                <strong>Add to Home screen</strong> or{" "}
                <strong>Install app</strong>. Open Tend online once, then your
                prayer book, verse play and saved sittings are available
                offline.
              </p>
              <p>
                For a paper companion, open Our season and choose “Take it to
                paper”.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Journal({ model }) {
  const [filter, setFilter] = useState("all");
  const events = [
    ...model.sessions.map((s) => ({ ...s, kind: "prayer" })),
    ...model.practices.map((s) => ({ ...s, kind: "practice" })),
  ]
    .filter((s) => filter === "all" || s.participants.includes(filter))
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || (b.at || "").localeCompare(a.at || ""),
    );
  const nameOf = (s) =>
    listNames(
      s.names ||
        s.participants.map(
          (id) =>
            model.household.members.find((m) => m.id === id)?.name ||
            "A household member",
        ),
    );
  return (
    <section className="journal">
      <div className="journal-title">
        <div>
          <span className="eyebrow">LOOKING BACK</span>
          <h2>Pages we’ve shared.</h2>
        </div>
        <label>
          Show{" "}
          <select
            aria-label="Filter memories by person"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Everyone</option>
            {model.household.members.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {events.length ? (
        <div className="journal-list">
          {events.slice(0, 18).map((s, i) => (
            <details key={s.id || i}>
              <summary>
                <span className="journal-date">{shortDate(s.date)}</span>
                <span>
                  {nameOf(s)}{" "}
                  <span className="muted">
                    {s.kind === "practice"
                      ? "practised the verse"
                      : s.mode === "together"
                        ? "prayed together"
                        : "prayed quietly"}
                  </span>
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <p>
                {s.kind === "practice"
                  ? "Time spent with the words. An invitation to remember them away from the screen, too."
                  : "A sitting, held in this household’s story. No missed-day tally and nothing to make up."}
              </p>
            </details>
          ))}
        </div>
      ) : (
        <p className="empty-journal">
          There’s room here for the moments you’ll share. Your first prayer will
          become the first page.
        </p>
      )}
      <p className="small muted">
        The garden never withers. These pages remember presence, not
        performance.
      </p>
    </section>
  );
}

function Season({ model, onSave, night }) {
  const [editing, setEditing] = useState(
    new URLSearchParams(location.search).get("edit") === "1",
  );
  const [board, setBoard] = useState(model.board);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    if (
      !board.word.trim() ||
      !board.season.trim() ||
      board.commitments.length < 3 ||
      board.commitments.some((v) => !v.trim())
    ) {
      setError("Add a word, a season and three small ways to live it.");
      return;
    }
    setError("");
    const next = {
      ...model,
      board: {
        ...board,
        word: board.word.trim(),
        season: board.season.trim(),
        commitments: board.commitments.map((v) => v.trim()).filter(Boolean),
      },
      seasons: [
        ...(model.seasons || []),
        { ...model.board, date: dateKey(new Date()), id: crypto.randomUUID() },
      ],
    };
    onSave(next);
    setEditing(false);
    setSaved(true);
  }
  return (
    <main className="season-page">
      {editing ? (
        <form className="season-form" onSubmit={submit}>
          <span className="eyebrow accent">A NEW SEASON</span>
          <h1>
            Who are we
            <br />
            <em>becoming?</em>
          </h1>
          <p className="lede">Choose together. Keep it small enough to live.</p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label>
            One word to grow towards
            <input
              required
              maxLength={32}
              value={board.word}
              onChange={(e) => setBoard({ ...board, word: e.target.value })}
            />
          </label>
          <label>
            A name for this season
            <input
              required
              maxLength={60}
              value={board.season}
              onChange={(e) => setBoard({ ...board, season: e.target.value })}
            />
          </label>
          <fieldset>
            <legend>Three small ways to live it</legend>
            {[0, 1, 2].map((i) => (
              <label key={i} className="commitment-input">
                <span>{String(i + 1).padStart(2, "0")}</span>
                <input
                  aria-label={`Small practice ${i + 1}`}
                  required
                  maxLength={100}
                  value={board.commitments[i] || ""}
                  onChange={(e) => {
                    const c = [...board.commitments];
                    c[i] = e.target.value;
                    setBoard({ ...board, commitments: c });
                  }}
                />
              </label>
            ))}
          </fieldset>
          <label>
            What gets in the way?
            <input
              maxLength={100}
              value={board.friction}
              onChange={(e) => setBoard({ ...board, friction: e.target.value })}
            />
          </label>
          <p className="small muted">
            This is direction, not a daily checklist. You can return and change
            it.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setBoard(model.board);
                setError("");
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              Keep this season <Arrow />
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="season-spread">
            <div className="season-copy">
              <span className="eyebrow accent">
                OUR SEASON · {model.board.season}
              </span>
              <h1>
                Our word for
                <br />
                this season:
                <br />
                <em>{model.board.word}.</em>
              </h1>
              <p className="lede">
                A word to return to.
                <br />A direction to grow in, together.
              </p>
              <button
                className="button secondary"
                onClick={() => setEditing(true)}
              >
                Look at it together <Arrow />
              </button>
              {saved && (
                <p role="status" className="small">
                  Your season is saved on this device.
                </p>
              )}
            </div>
            <div className="season-art">
              <GardenScene
                compact
                night={night}
                planted={model.sessions.length}
              />
            </div>
          </div>
          <section className="season-practices">
            <span className="eyebrow">WE’LL MAKE ROOM FOR IT BY</span>
            {model.board.commitments.map((line, i) => (
              <div key={i}>
                <span className="chapter-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2>{line}</h2>
              </div>
            ))}
          </section>
          <div className="season-bottom">
            <p>
              <span className="eyebrow">WHEN IT’S HARD</span>
              {model.board.friction || "We can begin again, kindly."}
            </p>
            <button className="text-button" onClick={() => window.print()}>
              Take it to paper <Arrow />
            </button>
          </div>
          {model.seasons?.length > 0 && (
            <details className="past-seasons">
              <summary>Earlier seasons ({model.seasons.length})</summary>
              {model.seasons.map((s, i) => (
                <p key={i}>
                  {s.season}: <strong>{s.word}</strong> ·{" "}
                  {s.commitments.join(" · ")}
                </p>
              ))}
            </details>
          )}
        </>
      )}
    </main>
  );
}

function Household({ model, onSave, onDemo }) {
  const existing = model.household.members;
  const [name, setName] = useState(
    model.demo ? "Our household" : model.household.name,
  );
  const [names, setNames] = useState(
    model.demo ? "" : existing.map((p) => p.name).join("\n"),
  );
  const [error, setError] = useState("");
  function submit(e) {
    e.preventDefault();
    const rows = names
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!rows.length) {
      setError("Add at least one person to begin.");
      return;
    }
    if (rows.some((s) => s.length > 40)) {
      setError("Use a name or nickname of 40 letters or fewer.");
      return;
    }
    if (rows.length > 24) {
      setError("Keep this household to 24 people or fewer.");
      return;
    }
    if (new Set(rows.map((s) => s.toLocaleLowerCase())).size !== rows.length) {
      setError("Give each person a different name or nickname.");
      return;
    }
    const base = model.demo ? freshModel() : model;
    const members = rows.map(
      (n, i) =>
        existing.find((p) => p.name.toLowerCase() === n.toLowerCase()) || {
          id: crypto.randomUUID(),
          name: n,
          color: colors[i % colors.length],
        },
    );
    onSave({
      ...base,
      demo: false,
      household: { name: name.trim() || "Our household", members },
    });
  }
  return (
    <main className="household-page">
      <div className="household-intro">
        <span className="eyebrow accent">YOUR HOUSEHOLD</span>
        <h1>
          A place for
          <br />
          <em>your people.</em>
        </h1>
        <p className="lede">
          A name for this little place.
          <br />A name for everyone it holds.
        </p>
        <p className="small muted">
          Everything stays on this device. There’s no sign-in, and no need to
          add ages or any other personal details.
        </p>
        <BranchMark />
      </div>
      <form onSubmit={submit} className="household-form">
        <label>
          What shall we call your household?
          <input
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Our household"
          />
        </label>
        <label>
          Who’s in your household?
          <span className="field-note">One name or nickname on each line.</span>
          <textarea
            required
            rows={6}
            maxLength={1000}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder={"Alex\nSam\nRobin\nJamie"}
          />
        </label>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="button primary">
          {existing.length && !model.demo
            ? "Save your household"
            : "Begin your book"}{" "}
          <Arrow />
        </button>
        {!existing.length && (
          <button className="text-button" type="button" onClick={onDemo}>
            Or explore a fictional household first <Arrow />
          </button>
        )}
        <p className="small muted">
          Use nicknames if this is a shared device. You can return here to make
          changes.
        </p>
      </form>
    </main>
  );
}

function Release({ onDone }) {
  const [child, setChild] = useState(false);
  const [stage, setStage] = useState(0);
  const [stone, setStone] = useState("Unkind words");
  const [drag, setDrag] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  return (
    <main className="practice-page release-page">
      <div className="practice-top">
        <span className="eyebrow">CLEARING THE GROUND</span>
        <div className="mode-tabs">
          <button
            aria-pressed={!child}
            onClick={() => {
              setChild(false);
              setStage(0);
            }}
          >
            Quietly
          </button>
          <button
            aria-pressed={child}
            onClick={() => {
              setChild(true);
              setStage(0);
            }}
          >
            With children
          </button>
        </div>
      </div>
      <div className="release-leaf">
        <span className="eyebrow accent">
          {stage === 0 ? "NOTICE" : stage === 1 ? "ASK" : "BEGIN AGAIN"}
        </span>
        <h1>
          {stage === 0 ? (
            <>
              What might you
              <br />
              <em>lay down?</em>
            </>
          ) : stage === 1 ? (
            <>
              Bring it honestly.
              <br />
              <em>You are loved.</em>
            </>
          ) : (
            <>
              Mercy makes room
              <br />
              <em>for a new beginning.</em>
            </>
          )}
        </h1>
        {!child ? (
          <>
            <p className="practice-intro">
              {stage === 0
                ? "Bring to mind a moment you withheld love. A word, an action, or something left undone. Tell God plainly."
                : stage === 1
                  ? "Jesus, I bring you what I wish I had done differently. Forgive me. Help me receive your mercy, and help me put right what I can."
                  : "You do not have to carry this alone. If a repair is needed, choose one small act of love: an apology, a kind word, a fresh start."}
            </p>
            <p className="small muted">
              {stage === 0
                ? "No need to type it. Nothing about this reflection is saved."
                : stage === 1
                  ? "Stay here as long as you need."
                  : "Grace is a gift, not a reward for finishing a task."}
            </p>
          </>
        ) : (
          <>
            {stage === 0 ? (
              <>
                <p className="practice-intro">
                  Is there something you wish you had done differently? Choose a
                  stone, or just be still.
                </p>
                <div className="stone-choices">
                  {["Unkind words", "Not sharing", "Leaving someone out"].map(
                    (s) => (
                      <button
                        aria-pressed={stone === s}
                        key={s}
                        onClick={() => setStone(s)}
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
              </>
            ) : stage === 1 ? (
              <>
                <p className="practice-intro">
                  Tell God what happened. You can keep it private.
                  <br />
                  Ask for forgiveness, then lay down the stone.
                </p>
                <div className="stone-place">
                  <button
                    className="confession-stone"
                    aria-label={`Lay down ${stone}`}
                    style={{
                      transform: `translate(${offset.x}px,${offset.y}px)`,
                    }}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      setDrag({ x: e.clientX, y: e.clientY });
                    }}
                    onPointerMove={(e) => {
                      if (drag)
                        setOffset({
                          x: e.clientX - drag.x,
                          y: e.clientY - drag.y,
                        });
                    }}
                    onPointerUp={() => {
                      if (Math.abs(offset.x) + Math.abs(offset.y) > 35)
                        setStage(2);
                      setDrag(null);
                      setOffset({ x: 0, y: 0 });
                    }}
                    onPointerCancel={() => {
                      setDrag(null);
                      setOffset({ x: 0, y: 0 });
                    }}
                    onClick={() => {
                      if (!drag) setStage(2);
                    }}
                  >
                    {stone}
                  </button>
                  <span className="stone-ground">
                    Drag the stone here, or tap it to lay it down.
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="practice-intro">
                  God’s love is bigger than our mistakes.
                  <br />
                  Is there someone you can be kind to, or say sorry to?
                </p>
                <p className="small muted">
                  You don’t need to tell the screen. You can go and do it.
                </p>
              </>
            )}
          </>
        )}
      </div>
      <div className="practice-actions">
        <button className="text-button" onClick={onDone}>
          Leave quietly
        </button>
        <button
          className="button primary"
          onClick={() => (stage < 2 ? setStage(stage + 1) : onDone())}
        >
          {stage === 0
            ? "Ask for forgiveness"
            : stage === 1
              ? "Continue when ready"
              : "Carry kindness with you"}{" "}
          <Arrow />
        </button>
      </div>
    </main>
  );
}

function Rest({ board, night, sessions, onDone }) {
  const [awake, setAwake] = useState(false);
  const lockRef = useRef(null);
  useEffect(
    () => () => {
      lockRef.current?.release();
    },
    [],
  );
  async function keepAwake() {
    try {
      const lock = await navigator.wakeLock.request("screen");
      lockRef.current = lock;
      setAwake(true);
      lock.addEventListener("release", () => setAwake(false));
    } catch {
      setAwake(false);
    }
  }
  return (
    <main className="rest-page">
      <div className="rest-controls">
        <button className="text-button" onClick={onDone}>
          ← Back to the book
        </button>
        {"wakeLock" in navigator && (
          <button className="text-button" onClick={keepAwake}>
            {awake ? "Screen will stay awake" : "Keep this screen awake"}
          </button>
        )}
      </div>
      <div className="rest-word">
        <span className="eyebrow">{board.season} · OUR SHARED DIRECTION</span>
        <h1>{board.word}</h1>
        <p>{board.commitments.join(" · ")}</p>
      </div>
      <GardenScene
        night={night}
        interactive
        planted={sessions}
        season={board.season}
      />
    </main>
  );
}
