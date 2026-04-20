export default function OrnamentDivider({ color = '#B85C38' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 'clamp(2rem, 5vw, 3.5rem) 0',
      }}
    >
      <div
        style={{
          height: '1px',
          width: '3rem',
          background: `linear-gradient(to right, transparent, ${color}66, transparent)`,
        }}
      />
      <div
        className="display"
        style={{
          color,
          fontSize: '0.9rem',
          fontStyle: 'italic',
          margin: '0 0.9rem',
          opacity: 0.8,
        }}
      >
        ✦
      </div>
      <div
        style={{
          height: '1px',
          width: '3rem',
          background: `linear-gradient(to right, transparent, ${color}66, transparent)`,
        }}
      />
    </div>
  );
}
