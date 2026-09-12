import { useEffect, useState } from 'react'
import {
  NOTE_NAMES,
  CHORD_QUALITIES,
  polarOppositeChordRoot,
  polarOppositeQuality,
} from '../data/polarHarmony.js'

const randomIndex = (n) => Math.floor(Math.random() * n)

export default function PolarChordTest({ tonicIndex }) {
  const [rootIndex, setRootIndex] = useState(() => randomIndex(NOTE_NAMES.length))
  const [quality, setQuality] = useState(() => CHORD_QUALITIES[randomIndex(CHORD_QUALITIES.length)])
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedQuality, setSelectedQuality] = useState(null)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  useEffect(() => {
    setRootIndex(randomIndex(NOTE_NAMES.length))
    setQuality(CHORD_QUALITIES[randomIndex(CHORD_QUALITIES.length)])
    setSelectedNote(null)
    setSelectedQuality(null)
    setResult(null)
  }, [tonicIndex])

  const correctNote = polarOppositeChordRoot(tonicIndex, rootIndex)
  const correctQuality = polarOppositeQuality(quality)
  const canSubmit = selectedNote !== null && selectedQuality !== null

  const handleSubmit = () => {
    if (!canSubmit) return
    const isCorrect = selectedNote === correctNote && selectedQuality === correctQuality
    setResult(isCorrect ? 'correct' : 'incorrect')
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))
  }

  const nextRound = () => {
    setRootIndex(randomIndex(NOTE_NAMES.length))
    setQuality(CHORD_QUALITIES[randomIndex(CHORD_QUALITIES.length)])
    setSelectedNote(null)
    setSelectedQuality(null)
    setResult(null)
  }

  return (
    <div className="card">
      <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
        What is the polar opposite of this chord?
      </p>

      <div className="key-row">
        <span className="key-chip" style={{ background: 'var(--blue)' }}>
          {NOTE_NAMES[rootIndex]}
          {quality}
        </span>
      </div>

      <div className="choice-block">
        <span className="choice-label">Note</span>
        <div className="choice-row">
          {NOTE_NAMES.map((name, i) => (
            <button
              key={name}
              className={`choice-pill${selectedNote === i ? ' selected' : ''}`}
              onClick={() => {
                setSelectedNote(i)
                setResult(null)
              }}
              disabled={result !== null}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="choice-block">
        <span className="choice-label">Quality</span>
        <div className="choice-row">
          {CHORD_QUALITIES.map((q) => (
            <button
              key={q}
              className={`choice-pill${selectedQuality === q ? ' selected' : ''}`}
              onClick={() => {
                setSelectedQuality(q)
                setResult(null)
              }}
              disabled={result !== null}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {result === null ? (
        <button className="big-button" onClick={handleSubmit} disabled={!canSubmit}>
          Submit
        </button>
      ) : (
        <>
          <div className={`feedback ${result === 'correct' ? 'correct' : 'incorrect'}`}>
            {result === 'correct'
              ? 'Correct!'
              : `Not quite — it's ${NOTE_NAMES[correctNote]}${correctQuality}.`}
          </div>
          <button className="big-button" onClick={nextRound}>
            Next
          </button>
        </>
      )}

      <span className="score-tag">
        Score: {score.correct} / {score.total}
      </span>
    </div>
  )
}
