// Did this visit start from Today (/today/)? Then each room offers the
// way back. Remembered for the session, so Pray → "Now abide" → Abide
// still knows.
export function fromToday() {
  try {
    if (new URLSearchParams(location.search).get('from') === 'today') sessionStorage.setItem('fromToday', '1');
    return sessionStorage.getItem('fromToday') === '1';
  } catch { return false; }
}
