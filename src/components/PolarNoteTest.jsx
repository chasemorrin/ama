import { useEffect, useState } from 'react'
import { NOTE_NAMES, polarOppositeNote } from '../data/polarHarmony.js'

const randomNoteIndex = () => Math.floor(Math.random() * NOTE_NAMES.length)

export default function PolarNoteTest({ tonicIndex }) {
  const [currentNote, setCurrentNote] = useState(randomNoteIndex)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  // A new tonic changes what "correct" means for the note already on
  // screen, so start a fresh round rather than leaving a stale prompt.
  useEffect(() => {
    setCurrentNote(randomNoteIndex())
    setSelected(null)
    setResult(null)
  }, [tonicIndex])

  const correctAnswer = polarOppositeNote(tonicIndex, currentNote)

  const handleSubmit = () => {
    if (selected === null) return
    const isCorrect = selected === correctAnswer
    setResult(isCorrect ? 'correct' : 'incorrect')
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))
  }

  const nextRound = () => {
    setCurrentNote(randomNoteIndex())
    setSelected(null)
    setResult(null)
  }

  return (
    <div className="card">
      <p style={{ margin: 0, color: 'var(--ink-soft)' }}>
        What is the polar opposite of this note?
      </p>

      <div className="key-row">
        <span className="key-chip" style={{ background: 'var(--pink)' }}>
          {NOTE_NAMES[currentNote]}
        </span>
      </div>

      <div className="choice-block">
        <span className="choice-label">Your answer</span>
        <div className="choice-row">
          {NOTE_NAMES.map((name, i) => (
            <button
              key={name}
              className={`choice-pill${selected === i ? ' selected' : ''}`}
              onClick={() => {
                setSelected(i)
                setResult(null)
              }}
              disabled={result !== null}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {result === null ? (
        <button className="big-button" onClick={handleSubmit} disabled={selected === null}>
          Submit
        </button>
      ) : (
        <>
          <div className={`feedback ${result === 'correct' ? 'correct' : 'incorrect'}`}>
            {result === 'correct'
              ? 'Correct!'
              : `Not quite — it's ${NOTE_NAMES[correctAnswer]}.`}
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
