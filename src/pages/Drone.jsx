import { useEffect, useRef, useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import { NOTE_NAMES } from '../data/polarHarmony.js'
import { noteToFrequency } from '../data/tetrachord.js'

const DRONE_OCTAVE = 3 // a register below middle C, typical for a sustained reference drone
const DETUNES_CENTS = [0, -4, 5] // a few slightly detuned voices for a warmer, less sterile tone
const FADE_SECONDS = 0.5

export default function Drone() {
  const [tonicIndex, setTonicIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioCtxRef = useRef(null)
  const voicesRef = useRef(null) // { oscillators, masterGain }

  useEffect(() => stopDrone, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Changing the tonic while the drone is already playing glides it to
  // the new pitch instead of requiring a stop/restart.
  useEffect(() => {
    if (!isPlaying || !voicesRef.current || !audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const freq = noteToFrequency({ name: NOTE_NAMES[tonicIndex], octave: DRONE_OCTAVE })
    voicesRef.current.oscillators.forEach((osc) => {
      osc.frequency.linearRampToValueAtTime(freq, ctx.currentTime + 0.12)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tonicIndex])

  const startDrone = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContextClass()
    audioCtxRef.current = ctx
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const freq = noteToFrequency({ name: NOTE_NAMES[tonicIndex], octave: DRONE_OCTAVE })

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0, ctx.currentTime)
    masterGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + FADE_SECONDS)
    masterGain.connect(ctx.destination)

    const oscillators = DETUNES_CENTS.map((cents) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.detune.value = cents
      osc.connect(masterGain)
      osc.start()
      return osc
    })

    voicesRef.current = { oscillators, masterGain }
    setIsPlaying(true)
  }

  const stopDrone = () => {
    const ctx = audioCtxRef.current
    const voices = voicesRef.current
    if (ctx && voices) {
      const now = ctx.currentTime
      voices.masterGain.gain.cancelScheduledValues(now)
      voices.masterGain.gain.setValueAtTime(voices.masterGain.gain.value, now)
      voices.masterGain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS)
      setTimeout(() => {
        voices.oscillators.forEach((osc) => {
          try {
            osc.stop()
          } catch {
            // already stopped - fine to ignore
          }
        })
        ctx.close().catch(() => {})
      }, FADE_SECONDS * 1000 + 60)
    }
    audioCtxRef.current = null
    voicesRef.current = null
    setIsPlaying(false)
  }

  const toggleDrone = () => {
    if (isPlaying) stopDrone()
    else startDrone()
  }

  return (
    <>
      <ExerciseTopbar title="Drone" />
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

        <div className="card">
          <button className="big-button" onClick={toggleDrone}>
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>
      </div>
    </>
  )
}
