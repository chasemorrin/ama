import { useEffect, useRef, useState } from 'react'
import { triggerSing } from '../data/rhythmAudio.js'
import { noteToFrequency } from '../data/tetrachord.js'

// A longer release than Rhythm Practice uses is what gives this a
// legato, sustained piano feel rather than a short beep - each note
// rings on well past its own rhythmic slot, overlapping into the next.
const LEGATO_RELEASE_SECONDS = 0.7

// `notes`: flat array of { name, octave } in playback order.
// `staffRef`: ref to a staff component exposing highlightNote(index) /
// clearHighlights() (TetrachordStaff or TetrachordPatternStaff).
// `tempo`: quarter-note BPM.
export function useTetrachordPlayer(notes, staffRef, tempo) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const stopTimeoutRef = useRef(null)
  const highlightTimeoutsRef = useRef([])

  const stopPlayback = () => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
    highlightTimeoutsRef.current.forEach(clearTimeout)
    highlightTimeoutsRef.current = []
    if (staffRef.current) staffRef.current.clearHighlights()
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setIsPlaying(false)
  }

  useEffect(() => stopPlayback, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startPlayback = async () => {
    if (notes.length === 0) return
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioContextClass()
    audioCtxRef.current = ctx
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const noteDurationSeconds = 60 / tempo

    notes.forEach((note, i) => {
      const frequency = noteToFrequency(note)
      const startTime = ctx.currentTime + i * noteDurationSeconds
      triggerSing(
        ctx,
        startTime,
        noteDurationSeconds,
        ctx.destination,
        frequency,
        LEGATO_RELEASE_SECONDS
      )

      const delayMs = Math.max(0, (startTime - ctx.currentTime) * 1000)
      const timeoutId = setTimeout(() => {
        if (staffRef.current) staffRef.current.highlightNote(i)
      }, delayMs)
      highlightTimeoutsRef.current.push(timeoutId)
    })

    const totalMs = notes.length * noteDurationSeconds * 1000 + 200
    stopTimeoutRef.current = setTimeout(stopPlayback, totalMs)
    setIsPlaying(true)
  }

  const togglePlayback = () => {
    if (isPlaying) stopPlayback()
    else startPlayback()
  }

  return { isPlaying, togglePlayback }
}
