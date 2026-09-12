const MIN_TEMPO = 40
const MAX_TEMPO = 240

export default function TempoControl({ tempo, onChange }) {
  return (
    <div className="choice-block">
      <span className="choice-label">Tempo: {tempo} BPM (quarter note)</span>
      <input
        type="range"
        min={MIN_TEMPO}
        max={MAX_TEMPO}
        value={tempo}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rhythm-tempo-slider"
      />
    </div>
  )
}
