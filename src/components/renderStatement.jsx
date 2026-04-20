// Highlights the heroWord inside a longer identity statement.
// Case-insensitive match on the first occurrence; returns plain text
// if the word isn't present.
export default function renderStatement(text, emphasis) {
  if (!emphasis) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(emphasis.toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + emphasis.length);
  const after = text.slice(idx + emphasis.length);
  return (
    <>
      {before}
      <em
        style={{
          fontStyle: 'italic',
          color: '#B85C38',
          fontVariationSettings: '"SOFT" 100, "WONK" 1, "opsz" 144',
        }}
      >
        {match}
      </em>
      {after}
    </>
  );
}
