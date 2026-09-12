export default function RhythmPartRow({
  title,
  color,
  options,
  selected,
  onSelect,
  muted,
  onToggleMute,
}) {
  return (
    <div className="rhythm-part">
      <span className="rhythm-label" style={{ background: color }}>
        {title}
      </span>
      <div className="choice-row">
        {options.map((opt) => (
          <button
            key={opt}
            className={`choice-pill${selected === opt ? ' selected' : ''}`}
            onClick={() => onSelect(opt)}
            style={{ textTransform: 'capitalize' }}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        className={`ghost-button rhythm-mute${muted ? ' rhythm-mute-active' : ''}`}
        onClick={onToggleMute}
      >
        {muted ? 'Muted' : 'Mute'}
      </button>
    </div>
  )
}
