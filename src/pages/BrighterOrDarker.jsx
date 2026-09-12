import { useEffect, useRef, useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import {
  randomKeyPair,
  getAnswer,
  colorForValue,
} from '../data/brighterDarker.js'

const STEP_OPTIONS = [1, 2, 3, 4, 5, 6]
const RUN_SECONDS = 30
const AUTO_ADVANCE_MS = 500 // brief pause so the flash of feedback is visible

const directionWord = (dir) =>
  dir === 'either' ? 'brighter or darker' : dir

export default function BrighterOrDarker() {
  const [mode, setMode] = useState('practice') // 'practice' | 'timed'

  // --- shared quiz state (one question at a time, used by both modes) ---
  const [pair, setPair] = useState(() => randomKeyPair())
  const [selectedSteps, setSelectedSteps] = useState(null)
  const [selectedDirection, setSelectedDirection] = useState(null)
  const [result, setResult] = useState(null) // null | 'correct' | 'incorrect'

  // --- practice-mode score (untimed, accumulates until the page reloads) ---
  const [practiceScore, setPracticeScore] = useState({ correct: 0, total: 0 })

  // --- timed-run state ---
  const [runPhase, setRunPhase] = useState('idle') // 'idle' | 'running' | 'done'
  const [timeLeft, setTimeLeft] = useState(RUN_SECONDS)
  const [runStats, setRunStats] = useState({ correct: 0, total: 0 })
  const [bestRun, setBestRun] = useState(null)
  const advanceTimeout = useRef(null)
  const countdownInterval = useRef(null)

  const [key1, key2] = pair
  const answer = getAnswer(key1.value, key2.value)
  const canSubmit = selectedSteps !== null && selectedDirection !== null

  const freshRound = () => {
    setPair(randomKeyPair())
    setSelectedSteps(null)
    setSelectedDirection(null)
    setResult(null)
  }

  const evaluate = (steps, direction) => {
    const stepsMatch = steps === answer.steps
    const directionMatch =
      answer.direction === 'either' || direction === answer.direction
    return stepsMatch && directionMatch
  }

  // ----- practice mode: manual Submit / Next -----
  const handlePracticeSubmit = () => {
    if (!canSubmit) return
    const isCorrect = evaluate(selectedSteps, selectedDirection)
    setResult(isCorrect ? 'correct' : 'incorrect')
    setPracticeScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))
  }

  // ----- timed mode: auto-submit the instant both choices are made -----
  useEffect(() => {
    if (mode !== 'timed' || runPhase !== 'running') return
    if (!canSubmit || result !== null) return

    const isCorrect = evaluate(selectedSteps, selectedDirection)
    setResult(isCorrect ? 'correct' : 'incorrect')
    setRunStats((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }))

    advanceTimeout.current = setTimeout(() => {
      freshRound()
    }, AUTO_ADVANCE_MS)

    return () => clearTimeout(advanceTimeout.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSteps, selectedDirection, mode, runPhase])

  // ----- timed mode: countdown -----
  useEffect(() => {
    if (runPhase !== 'running') return
    countdownInterval.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdownInterval.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(countdownInterval.current)
  }, [runPhase])

  // when the countdown hits 0, end the run
  useEffect(() => {
    if (runPhase === 'running' && timeLeft === 0) {
      clearTimeout(advanceTimeout.current)
      setRunPhase('done')
      setRunStats((s) => {
        setBestRun((prev) => (prev === null || s.correct > prev ? s.correct : prev))
        return s
      })
    }
  }, [timeLeft, runPhase])

  const startRun = () => {
    clearTimeout(advanceTimeout.current)
    clearInterval(countdownInterval.current)
    setRunStats({ correct: 0, total: 0 })
    setTimeLeft(RUN_SECONDS)
    setRunPhase('running')
    freshRound()
  }

  const switchMode = (nextMode) => {
    clearTimeout(advanceTimeout.current)
    clearInterval(countdownInterval.current)
    setMode(nextMode)
    setRunPhase('idle')
    setTimeLeft(RUN_SECONDS)
    freshRound()
  }

  const showQuiz =
    mode === 'practice' || (mode === 'timed' && runPhase === 'running')

  return (
    <>
      <ExerciseTopbar title="Brighter or Darker" />
      <div className="page">
        <div className="choice-row" style={{ marginTop: 8 }}>
          <button
            className={`choice-pill${mode === 'practice' ? ' selected' : ''}`}
            onClick={() => switchMode('practice')}
          >
            Practice
          </button>
          <button
            className={`choice-pill${mode === 'timed' ? ' selected' : ''}`}
            onClick={() => switchMode('timed')}
          >
            Timed Run (30s)
          </button>
        </div>

        <div className="card">
          {mode === 'timed' && runPhase === 'idle' && (
            <>
              <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
                How many can you get right in {RUN_SECONDS} seconds? Pick a
                number and a direction for each pair — it grades itself
                instantly and moves on, so go as fast as you can.
              </p>
              <button className="big-button" onClick={startRun}>
                Start 30-Second Run
              </button>
              {bestRun !== null && (
                <span className="score-tag">Best so far: {bestRun} correct</span>
              )}
            </>
          )}

          {mode === 'timed' && runPhase === 'done' && (
            <>
              <div className="timer-display">Time's up!</div>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                You got <strong>{runStats.correct}</strong> correct out of{' '}
                {runStats.total} attempted.
              </p>
              {bestRun !== null && (
                <span className="score-tag">Best so far: {bestRun} correct</span>
              )}
              <button className="big-button" onClick={startRun}>
                Try Again
              </button>
              <button className="ghost-button" onClick={() => switchMode('practice')}>
                Back to Practice
              </button>
            </>
          )}

          {showQuiz && (
            <>
              {mode === 'timed' && (
                <div className="timer-display">0:{String(timeLeft).padStart(2, '0')}</div>
              )}

              <div className="key-row">
                <span
                  className="key-chip"
                  style={{ background: colorForValue(key1.value) }}
                >
                  {key1.name}
                </span>
                <span className="key-arrow">→</span>
                <span
                  className="key-chip"
                  style={{ background: colorForValue(key2.value) }}
                >
                  {key2.name}
                </span>
              </div>
              <p style={{ color: 'var(--ink-soft)', margin: 0 }}>
                How many keys brighter or darker is the second key?
              </p>

              <div className="choice-block">
                <span className="choice-label">Number of steps</span>
                <div className="choice-row choice-row-compact">
                  {STEP_OPTIONS.map((n) => (
                    <button
                      key={n}
                      className={`choice-pill choice-pill-compact${selectedSteps === n ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedSteps(n)
                        if (mode === 'practice') setResult(null)
                      }}
                      disabled={result !== null}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="choice-block">
                <span className="choice-label">Direction</span>
                <div className="choice-row">
                  {['brighter', 'darker'].map((dir) => (
                    <button
                      key={dir}
                      className={`choice-pill${selectedDirection === dir ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedDirection(dir)
                        if (mode === 'practice') setResult(null)
                      }}
                      disabled={result !== null}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'practice' && result === null && (
                <button
                  className="big-button"
                  onClick={handlePracticeSubmit}
                  disabled={!canSubmit}
                >
                  Submit
                </button>
              )}

              {result !== null && (
                <div className={`feedback ${result === 'correct' ? 'correct' : 'incorrect'}`}>
                  {result === 'correct'
                    ? 'Correct!'
                    : `Not quite — it's ${answer.steps} ${directionWord(answer.direction)}.`}
                </div>
              )}

              {mode === 'practice' && result !== null && (
                <button className="big-button" onClick={freshRound}>
                  Next
                </button>
              )}

              {mode === 'practice' && (
                <span className="score-tag">
                  Score: {practiceScore.correct} / {practiceScore.total}
                </span>
              )}
              {mode === 'timed' && runPhase === 'running' && (
                <span className="score-tag">
                  Correct so far: {runStats.correct} / {runStats.total}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
