// The study, sprint 1 (?v=1, frozen exactly as handed in) or sprint 2
// (the default). Each is its own copy of the code, so the first can't
// drift while the second changes.
const v = new URLSearchParams(location.search).get('v');
if (v === '1') import('./v1/main.js');
else import('./v2/main.js');
