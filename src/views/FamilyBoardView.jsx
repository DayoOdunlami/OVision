import KoiBoard from '../KoiBoard.jsx';

// ═══════════════════════════════════════════════════════════════════
// FamilyBoardView — thin wrapper around the existing KoiBoard so the
// rest of the app can route to it like any other view. Intentionally
// minimal: the Family Board has its own full-viewport layout, its own
// state, and its own model (DEFAULT inside KoiBoard.jsx); Stage 1
// leaves all of that untouched.
// ═══════════════════════════════════════════════════════════════════

export default function FamilyBoardView() {
  return <KoiBoard />;
}
