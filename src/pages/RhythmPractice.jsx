import { useEffect, useRef, useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import RhythmPartRow from '../components/RhythmPartRow.jsx'
import RhythmScore from '../components/RhythmScore.jsx'
import { PART_OPTIONS, randomCombo, startTimesForOption } from '../data/rhythm.js'
import { triggerKick, triggerClap, triggerSing } from '../data/rhythmAudio.js'

const PART_META = {
  sing: { title: 'Sing', color: 'var(--violet)' },
  clap: { title: 'Clap', color: 'var(--teal)' },
  step: { title: 'Step', color: 'var(--yellow)' },
}
const ROW_COLORS = { sing: 'var(--violet)', clap: 'var(--teal)', step: 'var(--yellow)' }

const SCHEDULE_AHEAD_SECONDS = 0.15
const SCHEDULER_INTERVAL_MS = 25
const MIN_TEMPO = 40
const MAX_TEMPO = 160

export default function RhythmPractice() {
  const [options, setOptions] = useState({ sing: 4, clap: 3, step: 6 })
  const [muted, setMuted] = useState({ sing: false, clap: false, step: false })
  const [tempo, setTempo] = useState(80) // BPM of the dotted-quarter beat
  const [isPlaying, setIsPlaying] = useState(false)

  const audioCtxRef = useRef(null)
  const masterGainRef = useRef(null)
  const timerRef = useRef(null)
  const nextMeasureTimeRef = useRef(0)
  const highlightTimeoutsRef = useRef([])
  const scoreRef = useRef(null)

  // Refs mirror the latest state so the scheduler loop (started once per
  // play session) always reads live values without needing a restart -
  // this is what lets randomizing or changing a row while playing just
  // flow into the next loop instead of cutting playback off.
  const optionsRef = useRef(options)
  const mutedRef = useRef(muted)
  const tempoRef = useRef(tempo)
  useEffect(() => {
    optionsRef.current = options
  }, [options])
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])
  useEffect(() => {
    tempoRef.current = tempo
  }, [tempo])

  useEffect(() => {
    return () => stopPlayback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scheduleMeasure = (measureStart) => {
    const ctx = audioCtxRef.current
    const dest = masterGainRef.current
    const eighthDur = 60 / tempoRef.current / 3
    const opts = optionsRef.current
    const currentParts = {
      sing: startTimesForOption(opts.sing),
      clap: startTimesForOption(opts.clap),
      step: startTimesForOption(opts.step),
    }

    const scheduleHighlight = (part, index, when) => {
      const delayMs = Math.max(0, (when - ctx.currentTime) * 1000)
      const id = setTimeout(() => {
        scoreRef.current && scoreRef.current.highlightNote(part, index)
      }, delayMs)
      highlightTimeoutsRef.current.push(id)
    }

    if (!mutedRef.current.step) {
      currentParts.step.starts.forEach((startUnit, i) => {
        const when = measureStart + startUnit * eighthDur
        triggerKick(ctx, when, dest)
        scheduleHighlight('step', i, when)
      })
    }
    if (!mutedRef.current.clap) {
      currentParts.clap.starts.forEach((startUnit, i) => {
        const when = measureStart + startUnit * eighthDur
        triggerClap(ctx, when, dest)
        scheduleHighlight('clap', i, when)
      })
    }
    if (!mutedRef.current.sing) {
      currentParts.sing.starts.forEach((startUnit, i) => {
        const when = measureStart + startUnit * eighthDur
        const noteDur = currentParts.sing.units[i] * eighthDur
        triggerSing(ctx, when, noteDur, dest)
        scheduleHighlight('sing', i, when)
      })
    }
  }

  const startPlayback = async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext

    // A fresh context every time playback starts avoids any leftover
    // state (like a volume stuck at zero) from a previous stop/start
    // cycle - it always begins at full volume with a clean node graph.
    const ctx = new AudioContextClass()
    const masterGain = ctx.createGain()
    masterGain.connect(ctx.destination)
    audioCtxRef.current = ctx
    masterGainRef.current = masterGain

    // Resuming is asynchronous - scheduling sounds before it actually
    // finishes is what can cause a "no sound" symptom on some browsers,
    // so we wait for it here.
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    nextMeasureTimeRef.current = ctx.currentTime + 0.05

    timerRef.current = setInterval(() => {
      while (nextMeasureTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
        scheduleMeasure(nextMeasureTimeRef.current)
        const measureDur = (60 / tempoRef.current / 3) * 12
        nextMeasureTimeRef.current += measureDur
      }
    }, SCHEDULER_INTERVAL_MS)

    setIsPlaying(true)
  }

  const stopPlayback = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    highlightTimeoutsRef.current.forEach(clearTimeout)
    highlightTimeoutsRef.current = []
    if (scoreRef.current) scoreRef.current.clearHighlights()

    // Closing the audio engine outright kills every sound already
    // scheduled instantly - simpler and more reliable than trying to
    // silence a long-lived node graph through volume automation.
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
      masterGainRef.current = null
    }

    setIsPlaying(false)
  }

  const togglePlayback = () => {
    if (isPlaying) stopPlayback()
    else startPlayback()
  }

  const toggleMute = (part) => {
    setMuted((m) => ({ ...m, [part]: !m[part] }))
  }

  // Selecting a new option or hitting Randomize never stops playback -
  // optionsRef updates immediately, and scheduleMeasure always reads it
  // fresh, so whichever measure hasn't been scheduled yet picks up the
  // new pattern on its own, right on the next loop.
  const selectOption = (part, value) => {
    setOptions((o) => ({ ...o, [part]: value }))
  }

  const handleRandomize = () => {
    setOptions(randomCombo())
  }

  return (
    <>
      <ExerciseTopbar title="Rhythm Practice" />
      <div className="page">
        <div className="rhythm-toolbar">
          <button className="ghost-button" onClick={handleRandomize}>
            🎲 Randomize
          </button>
        </div>

        <div className="rhythm-grid">
          {['sing', 'clap', 'step'].map((part) => (
            <RhythmPartRow
              key={part}
              title={PART_META[part].title}
              color={PART_META[part].color}
              options={PART_OPTIONS[part]}
              selected={options[part]}
              onSelect={(value) => selectOption(part, value)}
              muted={muted[part]}
              onToggleMute={() => toggleMute(part)}
            />
          ))}
        </div>

        <div className="rhythm-score-card">
          <RhythmScore ref={scoreRef} options={options} colors={ROW_COLORS} />
        </div>

        <div className="card rhythm-transport">
          <button className="big-button" onClick={togglePlayback}>
            {isPlaying ? 'Stop' : 'Play'}
          </button>

          <div className="choice-block">
            <span className="choice-label">
              Tempo: {tempo} BPM (dotted quarter note)
            </span>
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
      </div>
    </>
  )
}
