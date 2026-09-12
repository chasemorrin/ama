import { useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import PolarNoteTest from '../components/PolarNoteTest.jsx'
import PolarChordTest from '../components/PolarChordTest.jsx'
import { NOTE_NAMES } from '../data/polarHarmony.js'

export default function PolarHarmony() {
  const [tonicIndex, setTonicIndex] = useState(0)
  const [mode, setMode] = useState('note') // 'note' | 'chord'

  return (
    <>
      <ExerciseTopbar title="Polar Harmony" />
      <div className="page">
        <div className="card">
          <div className="choice-block">
            <span className="choice-label">Tonic / Key</span>
            <div className="choice-row">
              {NOTE_NAMES.map((name, i) => (
                <button
                  key={name}
                  className={`choice-pill${tonicIndex === i ? ' selected' : ''}`}
                  onClick={() => setTonicIndex(i)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="choice-row" style={{ marginTop: 16 }}>
          <button
            className={`choice-pill${mode === 'note' ? ' selected' : ''}`}
            onClick={() => setMode('note')}
          >
            Note Test
          </button>
          <button
            className={`choice-pill${mode === 'chord' ? ' selected' : ''}`}
            onClick={() => setMode('chord')}
          >
            Chord Test
          </button>
        </div>

        {mode === 'note' ? (
          <PolarNoteTest tonicIndex={tonicIndex} />
        ) : (
          <PolarChordTest tonicIndex={tonicIndex} />
        )}
      </div>
    </>
  )
}
