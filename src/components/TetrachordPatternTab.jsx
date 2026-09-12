import { useMemo, useRef, useState } from 'react'
import TetrachordPatternStaff from './TetrachordPatternStaff.jsx'
import TempoControl from './TempoControl.jsx'
import { useTetrachordPlayer } from '../hooks/useTetrachordPlayer.js'
import {
  PERMUTATIONS,
  TETRACHORD_TYPES,
  buildTetrachordPattern,
} from '../data/tetrachord.js'

export default function TetrachordPatternTab() {
  const [permutationIndex, setPermutationIndex] = useState(0)
  const [tetrachordType, setTetrachordType] = useState('major')
  const [tempo, setTempo] = useState(120)

  const staffRef = useRef(null)

  const measures = useMemo(
    () => buildTetrachordPattern({ permutationIndex, tetrachordType }),
    [permutationIndex, tetrachordType]
  )

  const allNotes = useMemo(() => measures.flatMap((m) => m.notes), [measures])

  const { isPlaying, togglePlayback } = useTetrachordPlayer(allNotes, staffRef, tempo)

  const handleRandomize = () => {
    const types = Object.keys(TETRACHORD_TYPES)
    setTetrachordType(types[Math.floor(Math.random() * types.length)])
    setPermutationIndex(Math.floor(Math.random() * PERMUTATIONS.length))
  }

  return (
    <>
      <div className="rhythm-toolbar">
        <button className="ghost-button" onClick={handleRandomize}>
          🎲 Randomize
        </button>
      </div>

      <div className="card">
        <div className="choice-block">
          <span className="choice-label">Tetrachord Type</span>
          <div className="choice-row">
            {Object.entries(TETRACHORD_TYPES).map(([key, { label }]) => (
              <button
                key={key}
                className={`choice-pill${tetrachordType === key ? ' selected' : ''}`}
                onClick={() => setTetrachordType(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="choice-block">
          <span className="choice-label">Permutation</span>
          <div className="choice-row choice-row-compact">
            {PERMUTATIONS.map((_, i) => (
              <button
                key={i}
                className={`choice-pill choice-pill-compact${permutationIndex === i ? ' selected' : ''}`}
                onClick={() => setPermutationIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <TetrachordPatternStaff ref={staffRef} measures={measures} />
        <button className="big-button" onClick={togglePlayback}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <TempoControl tempo={tempo} onChange={setTempo} />
      </div>
    </>
  )
}
