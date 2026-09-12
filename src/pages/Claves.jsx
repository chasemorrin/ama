import { useEffect, useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import ClavePad from '../components/ClavePad.jsx'
import { fetchClavePresets } from '../data/claves.js'

export default function Claves() {
  const [presets, setPresets] = useState(null) // null while loading
  const [error, setError] = useState(null)
  const [activeName, setActiveName] = useState(null)

  const load = () => {
    setError(null)
    setPresets(null)
    setActiveName(null)
    fetchClavePresets()
      .then(setPresets)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  const handleToggle = (name) => {
    setActiveName((current) => (current === name ? null : name))
  }

  return (
    <>
      <ExerciseTopbar title="Claves" />
      <div className="page">
        {error && (
          <div className="card">
            <p className="empty-state">Couldn't load patterns: {error}</p>
            <button className="ghost-button" onClick={load}>
              Try Again
            </button>
          </div>
        )}

        {!error && presets === null && (
          <div className="card">
            <p className="empty-state">Loading patterns…</p>
          </div>
        )}

        {!error && presets && presets.length === 0 && (
          <div className="card">
            <p className="empty-state">No patterns found yet.</p>
          </div>
        )}

        {!error && presets && presets.length > 0 && (
          <div className="clave-list">
            {presets.map((preset) => (
              <ClavePad
                key={preset.name}
                preset={preset}
                isActive={activeName === preset.name}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
