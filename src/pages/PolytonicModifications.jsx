import { useMemo, useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import {
  PRESET_PROGRESSIONS,
  SUBSTITUTION_SYSTEMS,
  parseProgression,
  generateSubstitution,
} from '../data/polytonic.js'

export default function PolytonicModifications() {
  const [progressionText, setProgressionText] = useState(PRESET_PROGRESSIONS['ii-V-I'])
  const [result, setResult] = useState(null) // { systemKey, chords }

  const { chords, invalid } = useMemo(() => parseProgression(progressionText), [progressionText])

  const selectPreset = (key) => {
    setProgressionText(PRESET_PROGRESSIONS[key])
    setResult(null)
  }

  const handleTextChange = (e) => {
    setProgressionText(e.target.value)
    setResult(null)
  }

  const handleGenerate = (systemKey) => {
    if (chords.length === 0) return
    setResult({ systemKey, chords: generateSubstitution(chords, systemKey) })
  }

  return (
    <>
      <ExerciseTopbar title="Polytonic Modifications" />
      <div className="page">
        <div className="card">
          <div className="choice-block">
            <span className="choice-label">Progression</span>
            <div className="choice-row">
              {Object.keys(PRESET_PROGRESSIONS).map((key) => (
                <button
                  key={key}
                  className={`choice-pill${progressionText === PRESET_PROGRESSIONS[key] ? ' selected' : ''}`}
                  onClick={() => selectPreset(key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="choice-block">
            <span className="choice-label">Or write your own (comma-separated)</span>
            <input
              type="text"
              className="text-input"
              value={progressionText}
              onChange={handleTextChange}
              placeholder="Cmaj7, A-7, D-7, G7"
            />
            {invalid.length > 0 && (
              <p className="empty-state" style={{ margin: 0 }}>
                Couldn't understand: {invalid.join(', ')}.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <span className="choice-label">Original</span>
          <div className="chord-row">
            {chords.map((c, i) => (
              <span key={i} className="chord-chip chord-chip-neutral">
                {c.rootDisplay}
                {c.quality}
              </span>
            ))}
          </div>
        </div>

        <div className="choice-row" style={{ marginTop: 8, justifyContent: 'center' }}>
          <button
            className="big-button"
            onClick={() => handleGenerate(3)}
            disabled={chords.length === 0}
          >
            Generate 3 Tonic Substitutions
          </button>
          <button
            className="big-button"
            onClick={() => handleGenerate(4)}
            disabled={chords.length === 0}
          >
            Generate 4 Tonic Substitutions
          </button>
        </div>

        {result && (
          <div className="card">
            <span className="choice-label">{SUBSTITUTION_SYSTEMS[result.systemKey].label} Substitution</span>
            <div className="chord-row">
              {result.chords.map((c, i) => (
                <span key={i} className={`chord-chip chord-chip-${c.color}`}>
                  {c.rootDisplay}
                  {c.quality}
                </span>
              ))}
            </div>
            <p className="chord-legend">
              <span className="chord-legend-dot chord-legend-dot-up" /> up a{' '}
              {SUBSTITUTION_SYSTEMS[result.systemKey].intervalName}
              {'  '}
              <span className="chord-legend-dot chord-legend-dot-down" /> down a{' '}
              {SUBSTITUTION_SYSTEMS[result.systemKey].intervalName}
              {result.systemKey === 4 && (
                <>
                  {'  '}
                  <span className="chord-legend-dot chord-legend-dot-tritone" /> tritone away
                </>
              )}
              {'  '}
              <span className="chord-legend-dot chord-legend-dot-neutral" /> unchanged
            </p>
          </div>
        )}
      </div>
    </>
  )
}
