import { useMemo, useRef, useState } from 'react'
import TetrachordStaff from './TetrachordStaff.jsx'
import TempoControl from './TempoControl.jsx'
import { useTetrachordPlayer } from '../hooks/useTetrachordPlayer.js'
import {
  INVERSIONS,
  PERMUTATIONS,
  TETRACHORD_TYPES,
  EXTRA_LOWER_TETRACHORDS,
  buildTetrachordFromNotes,
} from '../data/tetrachord.js'

const BASIC_KEYS = Object.keys(TETRACHORD_TYPES)
const ALL_TYPE_KEYS = [...BASIC_KEYS, ...EXTRA_LOWER_TETRACHORDS.map((_, i) => `extra-${i}`)]

function noteNamesForKey(key) {
  if (key.startsWith('extra-')) {
    return EXTRA_LOWER_TETRACHORDS[Number(key.slice('extra-'.length))]
  }
  return TETRACHORD_TYPES[key].lower
}

export default function SingleTetrachordTab() {
  const [inversionIndex, setInversionIndex] = useState(0)
  const [permutationIndex, setPermutationIndex] = useState(0)
  const [typeKey, setTypeKey] = useState('major')
  const [showMore, setShowMore] = useState(false)
  const [tempo, setTempo] = useState(120)

  const staffRef = useRef(null)

  const notes = useMemo(
    () =>
      buildTetrachordFromNotes({
        inversionIndex,
        permutationIndex,
        noteNames: noteNamesForKey(typeKey),
      }),
    [inversionIndex, permutationIndex, typeKey]
  )

  const { isPlaying, togglePlayback } = useTetrachordPlayer(notes, staffRef, tempo)

  const handleRandomize = () => {
    setInversionIndex(Math.floor(Math.random() * INVERSIONS.length))
    setPermutationIndex(Math.floor(Math.random() * PERMUTATIONS.length))
    // Only reach into the non-traditional tetrachords when "More" is
    // actually open - otherwise stick to the four basic qualities, since
    // that's what's visibly on offer.
    const pool = showMore ? ALL_TYPE_KEYS : BASIC_KEYS
    setTypeKey(pool[Math.floor(Math.random() * pool.length)])
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
          <span className="choice-label">Inversion</span>
          <div className="choice-row">
            {INVERSIONS.map((label, i) => (
              <button
                key={label}
                className={`choice-pill${inversionIndex === i ? ' selected' : ''}`}
                onClick={() => setInversionIndex(i)}
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

        <div className="choice-block">
          <span className="choice-label">Tetrachord Type</span>
          <div className="choice-row">
            {BASIC_KEYS.map((key) => (
              <button
                key={key}
                className={`choice-pill${typeKey === key ? ' selected' : ''}`}
                onClick={() => setTypeKey(key)}
              >
                {TETRACHORD_TYPES[key].label}
              </button>
            ))}
            <button
              className={`choice-pill${showMore ? ' selected' : ''}`}
              onClick={() => setShowMore((v) => !v)}
            >
              More {showMore ? '▲' : '▼'}
            </button>
          </div>

          {showMore && (
            <div className="choice-row" style={{ marginTop: 4 }}>
              {EXTRA_LOWER_TETRACHORDS.map((noteNames, i) => {
                const key = `extra-${i}`
                return (
                  <button
                    key={key}
                    className={`choice-pill${typeKey === key ? ' selected' : ''}`}
                    onClick={() => setTypeKey(key)}
                  >
                    {noteNames.join('-')}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <TetrachordStaff ref={staffRef} notes={notes} />
        <button className="big-button" onClick={togglePlayback}>
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <TempoControl tempo={tempo} onChange={setTempo} />
      </div>
    </>
  )
}
