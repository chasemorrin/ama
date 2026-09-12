import { useMemo, useRef, useState } from 'react'
import TetrachordPatternStaff from './TetrachordPatternStaff.jsx'
import TempoControl from './TempoControl.jsx'
import { useTetrachordPlayer } from '../hooks/useTetrachordPlayer.js'
import {
  PERMUTATIONS,
  TETRACHORD_TYPES,
  buildTetrachord,
  parseSequenceInput,
} from '../data/tetrachord.js'

const MIN_RANDOM_LENGTH = 4
const MAX_RANDOM_LENGTH = 16
const DEFAULT_SEQUENCE = 'A1, B1, A2, B2'

export default function CustomGeneratorTab() {
  const [sequenceText, setSequenceText] = useState(DEFAULT_SEQUENCE)
  const [permutationIndex, setPermutationIndex] = useState(0)
  const [lowerType, setLowerType] = useState('major')
  const [upperType, setUpperType] = useState('major')
  const [tempo, setTempo] = useState(120)

  const staffRef = useRef(null)

  const { tokens, invalid } = useMemo(() => parseSequenceInput(sequenceText), [sequenceText])

  const measures = useMemo(
    () =>
      tokens.map(({ register, inversionIndex, label }) => ({
        label,
        notes: buildTetrachord({
          inversionIndex,
          permutationIndex,
          tetrachordType: register === 'lower' ? lowerType : upperType,
          register,
        }),
      })),
    [tokens, permutationIndex, lowerType, upperType]
  )

  const allNotes = useMemo(() => measures.flatMap((m) => m.notes), [measures])

  const { isPlaying, togglePlayback } = useTetrachordPlayer(allNotes, staffRef, tempo)

  const handleRandomizeSequence = () => {
    const count =
      MIN_RANDOM_LENGTH + Math.floor(Math.random() * (MAX_RANDOM_LENGTH - MIN_RANDOM_LENGTH + 1))
    const generated = Array.from({ length: count }, () => {
      const letter = Math.random() < 0.5 ? 'A' : 'B'
      const number = 1 + Math.floor(Math.random() * 4)
      return `${letter}${number}`
    })
    setSequenceText(generated.join(', '))
  }

  return (
    <>
      <div className="rhythm-toolbar">
        <button className="ghost-button" onClick={handleRandomizeSequence}>
          🎲 Randomize Sequence
        </button>
      </div>

      <div className="card">
        <div className="choice-block">
          <span className="choice-label">
            Sequence (comma-separated, e.g. A1, B2, A3, A1)
          </span>
          <input
            type="text"
            className="text-input"
            value={sequenceText}
            onChange={(e) => setSequenceText(e.target.value)}
            placeholder="A1, B1, A2, B2"
          />
          {invalid.length > 0 && (
            <p className="empty-state" style={{ margin: 0 }}>
              Couldn't understand: {invalid.join(', ')}. Use A1-A4 or B1-B4.
            </p>
          )}
        </div>

        <div className="choice-block">
          <span className="choice-label">Lower (A) Tetrachord Type</span>
          <div className="choice-row">
            {Object.entries(TETRACHORD_TYPES).map(([key, { label }]) => (
              <button
                key={key}
                className={`choice-pill${lowerType === key ? ' selected' : ''}`}
                onClick={() => setLowerType(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="choice-block">
          <span className="choice-label">Upper (B) Tetrachord Type</span>
          <div className="choice-row">
            {Object.entries(TETRACHORD_TYPES).map(([key, { label }]) => (
              <button
                key={key}
                className={`choice-pill${upperType === key ? ' selected' : ''}`}
                onClick={() => setUpperType(key)}
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
        {measures.length > 0 ? (
          <>
            <TetrachordPatternStaff ref={staffRef} measures={measures} markTurnaround={false} />
            <button className="big-button" onClick={togglePlayback}>
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            <TempoControl tempo={tempo} onChange={setTempo} />
          </>
        ) : (
          <p className="empty-state">
            Type a sequence above (like <code>A1, B1, A2, B2</code>) to generate notation.
          </p>
        )}
      </div>
    </>
  )
}
