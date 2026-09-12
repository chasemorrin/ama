import { useEffect, useRef, useState } from 'react'
import { triggerClave } from '../data/rhythmAudio.js'

const SCHEDULE_AHEAD_SECONDS = 0.15
const SCHEDULER_INTERVAL_MS = 25
const MIN_TEMPO = 40
const MAX_TEMPO = 400

// Each step is one beat at the preset's BPM - i.e. the BPM is the speed
// of each individual box, not a subdivision of a larger beat.
export default function ClavePad({ preset, isActive, onToggle }) {
  const [tempo, setTempo] = useState(preset.bpm)
  const [currentStep, setCurrentStep] = useState(-1)

  const tempoRef = useRef(tempo)
  const audioCtxRef = useRef(null)
  const timerRef = useRef(null)
  const nextStepTimeRef = useRef(0)
  const stepIndexRef = useRef(0)
  const highlightTimeoutsRef = useRef([])

  useEffect(() => {
    tempoRef.current = tempo
  }, [tempo])

  const stopScheduler = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    highlightTimeoutsRef.current.forEach(clearTimeout)
    highlightTimeoutsRef.current = []
    setCurrentStep(-1)
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }

  const startScheduler = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContextClass()
    audioCtxRef.current = ctx
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    stepIndexRef.current = 0
    nextStepTimeRef.current = ctx.currentTime + 0.05

    timerRef.current = setInterval(() => {
      while (nextStepTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
        const stepDuration = 60 / tempoRef.current // each step = one beat
        const index = stepIndexRef.current % preset.numSteps
        const when = nextStepTimeRef.current

        if (preset.steps[index]) {
          triggerClave(ctx, when, ctx.destination)
        }

        const delayMs = Math.max(0, (when - ctx.currentTime) * 1000)
        const timeoutId = setTimeout(() => setCurrentStep(index), delayMs)
        highlightTimeoutsRef.current.push(timeoutId)

        nextStepTimeRef.current += stepDuration
        stepIndexRef.current++
      }
    }, SCHEDULER_INTERVAL_MS)
  }

  useEffect(() => {
    if (isActive) startScheduler()
    else stopScheduler()
    return stopScheduler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  return (
    <div className="clave-pad">
      <div className="clave-pad-head">
        <span className="clave-name">{preset.name}</span>
        <button className="big-button" onClick={() => onToggle(preset.name)}>
          {isActive ? 'Stop' : 'Play'}
        </button>
      </div>

      <div className="clave-steps">
        {preset.steps.map((on, i) => (
          <span
            key={i}
            className={`clave-step${on ? ' clave-step-on' : ''}${
              isActive && currentStep === i ? ' clave-step-current' : ''
            }`}
          />
        ))}
      </div>

      <div className="choice-block">
        <span className="choice-label">Tempo: {tempo} BPM</span>
        <input
          type="range"
          min={MIN_TEMPO}
          max={MAX_TEMPO}
          value={tempo}
          onChange={(e) => setTempo(Number(e.target.value))}
          className="rhythm-tempo-slider"
        />
      </div>
    </div>
  )
}
