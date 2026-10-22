// Calendar math uses local date parts, then UTC day numbers. It never treats a
// YYYY-MM-DD as an instant, so a London or New York Sunday stays Sunday.
export const STORAGE_KEY = "tend.household.v1";
const DAY = 86400000;
const ANCHOR = Date.UTC(2026, 9, 19) / DAY;
const COLORS = [
  "#9a5d3e",
  "#657f6b",
  "#cc905b",
  "#6c8292",
  "#ac7479",
  "#9a945d",
];

// NIV verse wording checked against the licensed text pages on 22 October 2026.
// Eight verses, 70 words in total; the original prayers and reflections below
// are not quotations. Copyright acknowledgement is presented by the app.
// https://www.biblegateway.com/passage/?search=John+15%3A12&version=NIV
// https://www.biblegateway.com/passage/?search=Psalm+56%3A3&version=NIV
// https://www.biblegateway.com/passage/?search=1+Corinthians+16%3A14&version=NIV
// https://www.biblegateway.com/passage/?search=Romans+12%3A12&version=NIV
// https://www.biblegateway.com/passage/?search=1+Thessalonians+5%3A17&version=NIV
// https://www.biblegateway.com/passage/?search=Ephesians+4%3A32&version=NIV
// https://www.biblegateway.com/passage/?search=1+Thessalonians+5%3A16&version=NIV
// https://www.biblegateway.com/passage/?search=Psalm+119%3A105&version=NIV
const WEEKS = [
  {
    id: "john15-12",
    word: "Love",
    title: "The love we give",
    ref: "John 15:12",
    text: "My command is this: Love each other as I have loved you.",
    prayer: [
      "Jesus, I bring {names} before you. You know the hopes they carry and the things they find hard to say. Let them receive your love before they try to earn anyone’s approval. Help them feel at home with you.",
      "Give them patient eyes for the people nearest to them. In the ordinary work of this day, teach them to listen without preparing an answer, to make room for another person, and to offer kindness without needing to be noticed.",
      "Where our love has grown hurried or small, meet us with your mercy. Help us begin again with one generous act. Hold this household together through our differences, and let the love we share become shelter for someone beyond our door.",
    ],
    wonder: "I wonder who might need a little room in our day.",
    carry:
      "Choose one small act of love. Do it quietly, without keeping a tally.",
    context:
      "Jesus speaks to his friends before his death. His own love is the pattern and starting point for theirs. Read this slowly: it is an invitation into a relationship, not a demand to become impressive at being kind.",
  },
  {
    id: "psalm56-3",
    word: "Trust",
    title: "Room for our fears",
    ref: "Psalm 56:3",
    text: "When I am afraid, I put my trust in you.",
    prayer: [
      "God, I bring {names} before you, including the worries they may keep hidden. You do not ask them to pretend to be fearless. Be near in the places that feel uncertain, and help them tell the truth about what they need.",
      "Give them trustworthy people to turn to and the courage to ask for help. Where something is unsafe, lead them towards protection. Where the next step is simply unfamiliar, give them enough steadiness to take it without having to see the whole way.",
      "Teach this household to receive one another’s fears with gentleness. Keep us from laughing at what another person finds hard. Help us offer a listening ear, a practical hand, and the assurance that nobody has to carry everything alone today.",
    ],
    wonder: "I wonder what helps us feel safe enough to tell the truth.",
    carry:
      "If a worry returns, name it honestly before God. You may also ask someone safe for help.",
    context:
      "The psalm gives fear a voice rather than silencing it. Trust does not mean nothing frightening happens, or that asking for protection is a failure. We can pray while afraid and take sensible steps towards safety at the same time.",
  },
  {
    id: "1cor16-14",
    word: "Kindness",
    title: "Even the small things",
    ref: "1 Corinthians 16:14",
    text: "Do everything in love.",
    prayer: [
      "Father, I bring {names} before you. Be present in the small things that will fill their day: getting ready, work and learning, waiting, sharing, and coming home. Let ordinary moments become places where they can receive and offer your kindness.",
      "When someone interrupts their plans, give them patience. When a job feels beneath them, help them do it with care. When they need to say no, give them clear and gentle words. Let love shape both what they do and how they do it.",
      "Help our household notice the care that often goes unseen. Make us quick to say thank you and willing to share the work. May our love have hands and feet today, reaching beyond good intentions into something useful for another person.",
    ],
    wonder:
      "I wonder which ordinary part of today could be done with extra care.",
    carry:
      "Pick an everyday task and give it your full care. The task need not become bigger.",
    context:
      "This short instruction comes near the end of a letter to a community learning to live together. It is broad enough for work, disagreement, rest and service. Love is the way we approach a task, not another task to complete.",
  },
  {
    id: "rom12-12",
    word: "Hope",
    title: "A patient kind of hope",
    ref: "Romans 12:12",
    text: "Be joyful in hope, patient in affliction, faithful in prayer.",
    prayer: [
      "God of hope, I bring {names} before you. You know what they are waiting for and what has disappointed them. Give them room to grieve what is hard without losing sight of the good that may still be growing beyond their view.",
      "Sustain them when change is slow. Put companions beside them who can share the waiting and offer practical help. Where joy is possible, let them receive it freely. Where today is heavy, let them know that they do not have to perform happiness.",
      "Keep drawing our household back to you in simple, honest prayer. Help us recognise small signs of goodness and become part of the help we hope to see. We place the things we cannot control in your care and take the next faithful step.",
    ],
    wonder:
      "I wonder what we are waiting for, and how we might keep one another company.",
    carry:
      "Notice one small sign of goodness. Let it be enough for this moment.",
    context:
      "Paul places hope, endurance and prayer together in a description of shared life. This is not a promise that difficult feelings disappear. A hopeful household can tell the truth about suffering while keeping open a place for goodness and help.",
  },
  {
    id: "1thess5-17",
    word: "Pray",
    title: "An open conversation",
    ref: "1 Thessalonians 5:17",
    text: "pray continually,",
    prayer: [
      "Father, I bring {names} before you. Receive them as they are, whether words come easily or not. Help them know that a small honest prayer is welcome, and that silence can hold the things they cannot yet explain to anyone.",
      "Be with them between the moments they set aside to pray. In a busy room, on a journey, in a difficult conversation or a quiet pause, remind them that they can turn towards you. Give them freedom from needing to find perfect words.",
      "Make this household a place where we can ask for prayer without embarrassment. Teach us to listen before offering answers and to turn our concern into practical care. Keep our conversation with you open as we return to the ordinary work of the day.",
    ],
    wonder:
      "I wonder what a very small prayer might sound like in the middle of our day.",
    carry:
      "You can turn to God with a word, a question, a thank you, or no words at all.",
    context:
      "This line belongs to a series of short encouragements to a young Christian community. It need not mean keeping a religious performance running every second. It invites a life that keeps turning towards God, including while we attend properly to other people.",
  },
  {
    id: "eph4-32",
    word: "Mercy",
    title: "A gentle way back",
    ref: "Ephesians 4:32",
    text: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    prayer: [
      "Jesus, I bring {names} before you. You know where they have been hurt and where they have caused hurt. Meet them with truth and compassion. Help them receive your mercy without hiding what happened or pretending that it did not matter.",
      "Give them courage to offer a sincere apology where one is needed, and patience to listen to the person they have hurt. Show them a practical way to put something right. Where trust takes time to rebuild, help them honour that time.",
      "Let kindness shape the way our household begins again after conflict. Protect anyone who needs safety or a clear boundary. Keep us from using forgiveness to silence pain. Teach us to make room for repair, honest words, and the slow work of renewed trust.",
    ],
    wonder: "I wonder what a real apology might make possible.",
    carry:
      "An apology can be a beginning. Ask what would help put something right, and listen.",
    context:
      "The letter describes a community learning a different way of living. Kindness and forgiveness are rooted in God’s generosity. Forgiving does not require pretending that harm is harmless, avoiding consequences, or remaining in danger; wise boundaries can belong alongside mercy.",
  },
  {
    id: "1thess5-16",
    word: "Joy",
    title: "Noticing the gifts",
    ref: "1 Thessalonians 5:16",
    text: "Rejoice always,",
    prayer: [
      "God of every good gift, I bring {names} before you. Help them notice what is freely given today: a kind face, enough food, a new idea, a moment outdoors, a chance to rest. Let gratitude open their eyes without closing them to another person’s pain.",
      "Give them freedom to enjoy what is good without needing to collect it, compare it, or make it last forever. When someone else has reason to celebrate, help them join in generously. Where joy feels far away, surround them with patient care.",
      "Teach our household to make room for delight in ordinary days. Let our thanks become generosity rather than pride, and let our laughter leave nobody outside. We receive this day as a gift, including the parts that are unfinished or different from our plans.",
    ],
    wonder: "I wonder what good thing we nearly walked past today.",
    carry:
      "Name one gift, however small. You do not need to feel cheerful to give thanks.",
    context:
      "This brief encouragement sits beside prayer and thanksgiving. It is not an instruction to hide sadness or silence someone who is struggling. Christian joy can live alongside tears, because its ground is deeper than the success of a particular day.",
  },
  {
    id: "psalm119-105",
    word: "Light",
    title: "Enough for the next step",
    ref: "Psalm 119:105",
    text: "Your word is a lamp for my feet, a light on my path.",
    prayer: [
      "God, I bring {names} before you. You know the decisions in front of them and the questions they cannot yet answer. As they listen to Scripture, give them light for the next step rather than anxiety about seeing every part of the road ahead.",
      "Help them recognise wise advice and seek it without shame. Give them courage to change direction when they have made a mistake, and patience when an answer needs time. Let your words grow into understanding through the ordinary practice of living with others.",
      "Guide our household in choices that protect the vulnerable, welcome the overlooked, and make space for what matters. When our plans are uncertain, keep us gentle with one another. Help us walk the part of the path that is ours today, trusting you with what lies beyond.",
    ],
    wonder: "I wonder what the next kind or truthful step might be.",
    carry:
      "You do not need the whole map. Take the next wise step you can see.",
    context:
      "The psalm uses the picture of a lamp on a path: light close enough to walk by. Reading Scripture is not a way to predict every event. It can help form our judgement as we listen, seek wisdom, and put what we understand into practice.",
  },
];

function parts(value = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    if (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    )
      return [y, m - 1, d];
  } else if (value instanceof Date && Number.isFinite(value.getTime())) {
    return [value.getFullYear(), value.getMonth(), value.getDate()];
  }
  throw new RangeError("Expected a valid Date or YYYY-MM-DD calendar date");
}
function dayNumber(value) {
  return Date.UTC(...parts(value)) / DAY;
}
function keyFromDay(day) {
  return new Date(day * DAY).toISOString().slice(0, 10);
}
function modulo(n, m) {
  return ((n % m) + m) % m;
}
export function dateKey(date = new Date()) {
  return keyFromDay(dayNumber(date));
}
export function mondayKey(date = new Date()) {
  const day = dayNumber(date);
  return keyFromDay(day - modulo(new Date(day * DAY).getUTCDay() + 6, 7));
}
export function weekFor(date = new Date()) {
  const index = Math.floor((dayNumber(mondayKey(date)) - ANCHOR) / 7);
  return WEEKS[modulo(index, WEEKS.length)];
}

// A complete pair cycle works for any household size, including odd sizes.
// Sunday holds everyone. Sorting stable IDs prevents UI reordering changing a rota.
export function pairFor(date, members = []) {
  const people = [...members].sort((a, b) =>
    String(a.id).localeCompare(String(b.id)),
  );
  if (people.length < 2 || new Date(dayNumber(date) * DAY).getUTCDay() === 0)
    return people;
  const pairs = [];
  const circle = people.length % 2 ? [...people, null] : [...people];
  for (let round = 0; round < circle.length - 1; round += 1) {
    for (let i = 0; i < circle.length / 2; i += 1) {
      const a = circle[i];
      const b = circle[circle.length - 1 - i];
      if (a && b) pairs.push([a, b]);
    }
    circle.splice(1, 0, circle.pop());
  }
  // Six prayer-pair days per week; Sundays do not skip a pair in the cycle.
  const monday = dayNumber(mondayKey(date));
  const week = Math.floor((monday - ANCHOR) / 7);
  const weekday = dayNumber(date) - monday;
  return pairs[modulo(week * 6 + weekday, pairs.length)];
}

export function freshModel() {
  return {
    version: 1,
    demo: false,
    household: { name: "Our household", members: [] },
    board: {
      word: "Rooted",
      season: "This season",
      commitments: [
        "Make room for one another",
        "Pray in the ordinary moments",
        "Take kindness beyond our door",
      ],
      friction: "We hurry past what matters.",
    },
    sessions: [],
    practices: [],
    seasons: [],
  };
}
const shortText = (value, fallback = "", max = 100) =>
  typeof value === "string" ? value.trim().slice(0, max) : fallback;
function validKey(value) {
  try {
    return dateKey(value) === value;
  } catch {
    return false;
  }
}
function cleanBoard(raw = {}) {
  raw = raw && typeof raw === "object" ? raw : {};
  const defaults = freshModel().board;
  return {
    word: shortText(raw.word, defaults.word, 40) || defaults.word,
    season: shortText(raw.season, defaults.season, 60) || defaults.season,
    commitments: [0, 1, 2].map((i) =>
      shortText(
        Array.isArray(raw.commitments) ? raw.commitments[i] : undefined,
        defaults.commitments[i],
        140,
      ),
    ),
    friction: shortText(raw.friction, defaults.friction, 240),
  };
}
function cleanModel(raw) {
  if (
    !raw ||
    raw.version !== 1 ||
    typeof raw.household !== "object" ||
    !raw.household
  )
    return null;
  const seen = new Set();
  const members = (
    Array.isArray(raw.household.members) ? raw.household.members : []
  )
    .slice(0, 24)
    .flatMap((member, index) => {
      if (
        !member ||
        typeof member.id !== "string" ||
        !/^[a-zA-Z0-9_-]{1,80}$/.test(member.id) ||
        seen.has(member.id)
      )
        return [];
      const name = shortText(member.name, "", 60);
      if (!name) return [];
      seen.add(member.id);
      return [
        {
          id: member.id,
          name,
          color: /^#[0-9a-fA-F]{6}$/.test(member.color)
            ? member.color
            : COLORS[index % COLORS.length],
        },
      ];
    });
  const memberNames = new Map(
    members.map((member) => [member.id, member.name]),
  );
  const cleanRecords = (records, sessions) =>
    (Array.isArray(records) ? records : [])
      .filter(
        (record) =>
          record && typeof record.id === "string" && validKey(record.date),
      )
      .slice(-3000)
      .map((record) => {
        const originalIds = Array.isArray(record.participants)
          ? record.participants
          : [];
        const participants = [
          ...new Set(
            originalIds.filter(
              (id) =>
                typeof id === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(id),
            ),
          ),
        ].slice(0, 24);
        // Preserve departed people's dated records and names; a roster edit is not
        // permission to erase what happened. New sittings accept only current IDs.
        const names = participants.map((id) =>
          shortText(
            record.names?.[originalIds.indexOf(id)],
            memberNames.get(id) || "Household member",
            60,
          ),
        );
        return {
          id: shortText(record.id, "", 240),
          date: record.date,
          ...(sessions
            ? {
                at:
                  typeof record.at === "string" &&
                  Number.isFinite(Date.parse(record.at))
                    ? record.at
                    : `${record.date}T12:00:00.000Z`,
                mode: shortText(record.mode, "quiet", 30),
              }
            : {}),
          participants,
          names,
          verseId: WEEKS.some((week) => week.id === record.verseId)
            ? record.verseId
            : weekFor(record.date).id,
        };
      })
      .filter((record) => record.participants.length);
  return {
    version: 1,
    demo: raw.demo === true,
    household: {
      name:
        shortText(raw.household.name, "Our household", 80) || "Our household",
      members,
    },
    board: cleanBoard(raw.board),
    sessions: cleanRecords(raw.sessions, true),
    practices: cleanRecords(raw.practices, false),
    seasons: (Array.isArray(raw.seasons) ? raw.seasons : [])
      .filter((season) => season && validKey(season.date))
      .slice(-50)
      .map((season) => ({
        ...cleanBoard(season),
        date: season.date,
        id: shortText(season.id, `season-${season.date}`, 100),
      })),
  };
}
export function loadModel() {
  try {
    return (
      cleanModel(JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY))) ||
      freshModel()
    );
  } catch {
    return freshModel();
  }
}
export function saveModel(model) {
  try {
    const clean = cleanModel(model);
    if (!clean) return false;
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}
function participantsFor(model, participants) {
  const ids = new Set(model.household.members.map((member) => member.id));
  return [
    ...new Set(
      (Array.isArray(participants) ? participants : []).filter((id) =>
        ids.has(id),
      ),
    ),
  ].sort();
}
function stamp(date) {
  return date instanceof Date
    ? date.toISOString()
    : `${dateKey(date)}T12:00:00.000Z`;
}
export function recordSitting(
  model,
  { date = new Date(), participants = [], mode = "quiet", verseId } = {},
) {
  const who = participantsFor(model, participants);
  if (!who.length) return model;
  const key = dateKey(date);
  const kind = shortText(mode, "quiet", 30) || "quiet";
  const id = `s-${key}-${kind}-${who.join(".")}`;
  if (model.sessions.some((session) => session.id === id)) return model;
  const names = who.map(
    (id) => model.household.members.find((member) => member.id === id).name,
  );
  const session = {
    id,
    date: key,
    at: stamp(date),
    participants: who,
    names,
    mode: kind,
    verseId: verseId || weekFor(date).id,
  };
  return { ...model, sessions: [...model.sessions, session] };
}
export function recordPractice(
  model,
  { date = new Date(), participants = [], verseId } = {},
) {
  const who = participantsFor(model, participants);
  if (!who.length) return model;
  const key = dateKey(date);
  const verse = verseId || weekFor(date).id;
  const id = `p-${key}-${verse}-${who.join(".")}`;
  if (model.practices.some((practice) => practice.id === id)) return model;
  const names = who.map(
    (id) => model.household.members.find((member) => member.id === id).name,
  );
  return {
    ...model,
    practices: [
      ...model.practices,
      { id, date: key, participants: who, names, verseId: verse },
    ],
  };
}

export function demoModel(date = new Date()) {
  let model = freshModel();
  model.demo = true;
  model.household = {
    name: "The Willow household",
    members: ["Rowan", "Ellis", "Poppy", "Milo", "Iris", "Kit"].map(
      (name, index) => ({
        id: `person-${index + 1}`,
        name,
        color: COLORS[index],
      }),
    ),
  };
  model.board = {
    word: "Make room",
    season: "Autumn · a slower kind of together",
    commitments: [
      "Listen before we answer",
      "Make a little room at the table",
      "Notice someone who is left out",
    ],
    friction:
      "Our days get loud and hurried. We want to notice one another again.",
  };
  const today = dayNumber(date);
  const all = model.household.members.map((person) => person.id);
  for (let ago = 21; ago >= 1; ago -= 1) {
    const key = keyFromDay(today - ago);
    const sunday = new Date((today - ago) * DAY).getUTCDay() === 0;
    if (ago % 4 !== 0 || sunday)
      model = recordSitting(model, {
        date: key,
        participants: [all[0]],
        mode: "quiet",
        verseId: weekFor(key).id,
      });
    if (ago % 3 !== 0 || sunday)
      model = recordSitting(model, {
        date: key,
        participants: sunday ? all : [all[1], all[2], all[3]],
        mode: "together",
        verseId: weekFor(key).id,
      });
    if (ago % 5 === 1 || ago % 5 === 3)
      model = recordPractice(model, {
        date: key,
        participants: [all[2], all[3]],
        verseId: weekFor(key).id,
      });
  }
  model.seasons = [
    {
      id: "season-summer",
      date: keyFromDay(today - 42),
      word: "Outside",
      season: "Summer · noticing the world",
      commitments: [
        "Eat outside when we can",
        "Learn the names of growing things",
        "Take a walk without hurrying",
      ],
      friction: "We stay busy even when there is space to slow down.",
    },
  ];
  return model;
}
