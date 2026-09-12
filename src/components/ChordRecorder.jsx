import { useEffect, useRef, useState } from 'react'
import { detectChordSegments, sliceAudioBuffer, audioBufferToWavBlob } from '../data/audioProcessing.js'
import {
  addCustomChord,
  getAllCustomChords,
  clearAllCustomChords,
  getStorageCapBytes,
  increaseStorageCap,
  isAtMaxCap,
  formatBytes,
} from '../data/chordStorage.js'

export default function ChordRecorder({ onChordsChanged }) {
  const [expanded, setExpanded] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [status, setStatus] = useState('idle') // idle | analyzing | done | error
  const [message, setMessage] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [customCount, setCustomCount] = useState(0)
  const [usageBytes, setUsageBytes] = useState(0)
  const [capBytes, setCapBytes] = useState(getStorageCapBytes)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const startedAtRef = useRef(0)

  const refreshStats = async () => {
    const all = await getAllCustomChords()
    setCustomCount(all.length)
    setUsageBytes(all.reduce((sum, r) => sum + (r.size || 0), 0))
  }

  useEffect(() => {
    refreshStats()
    return () => clearInterval(timerRef.current)
  }, [])

  const startRecording = async () => {
    setMessage('')
    setStatus('idle')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = handleRecordingStop
      recorder.start()
      mediaRecorderRef.current = recorder

      setIsRecording(true)
      startedAtRef.current = Date.now()
      setElapsedSeconds(0)
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000))
      }, 250)
    } catch {
      setStatus('error')
      setMessage("Couldn't access the microphone — check your browser's permission settings.")
    }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    setIsRecording(false)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleRecordingStop = async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setStatus('analyzing')
    setMessage('Listening for chords…')

    try {
      const recordedBlob = new Blob(chunksRef.current, {
        type: mediaRecorderRef.current.mimeType,
      })
      const arrayBuffer = await recordedBlob.arrayBuffer()
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioContextClass()
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const segments = detectChordSegments(audioBuffer)
      audioCtx.close().catch(() => {})

      if (segments.length === 0) {
        setStatus('done')
        setMessage(
          'No chords detected — try playing a bit louder, or leave a small gap of silence between each chord.'
        )
        return
      }

      const cap = getStorageCapBytes()
      let remaining = cap - (await getAllCustomChords()).reduce((s, r) => s + (r.size || 0), 0)
      let savedCount = 0

      for (const segment of segments) {
        const sliced = sliceAudioBuffer(audioBuffer, segment.startSample, segment.endSample)
        const wavBlob = audioBufferToWavBlob(sliced)
        if (wavBlob.size > remaining) break
        await addCustomChord(wavBlob)
        remaining -= wavBlob.size
        savedCount++
      }

      await refreshStats()
      setStatus('done')
      if (savedCount === 0) {
        setMessage(
          `Found ${segments.length} chord${segments.length === 1 ? '' : 's'}, but there wasn't room to save any — increase your storage limit or clear some chords below.`
        )
      } else if (savedCount < segments.length) {
        setMessage(
          `Found ${segments.length} chords, saved ${savedCount} before hitting your storage limit. Increase the limit or clear some chords to save the rest.`
        )
      } else {
        setMessage(`Found and saved ${savedCount} chord${savedCount === 1 ? '' : 's'}!`)
      }
      onChordsChanged()
    } catch {
      setStatus('error')
      setMessage('Something went wrong processing that recording — mind trying again?')
    }
  }

  const handleClearAll = async () => {
    await clearAllCustomChords()
    await refreshStats()
    setStatus('idle')
    setMessage('')
    onChordsChanged()
  }

  const handleIncreaseCap = () => {
    setCapBytes(increaseStorageCap())
  }

  const usageFraction = Math.min(1, usageBytes / capBytes)

  return (
    <div className="recorder">
      <button className="ghost-button" onClick={() => setExpanded((v) => !v)}>
        🎤 Upload My Own Chords {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div className="recorder-panel">
          <p className="empty-state" style={{ margin: 0 }}>
            Record yourself playing a sequence of chords, with a brief pause
            between each - the app will automatically find and save each one
            separately.
          </p>

          <div className="recorder-controls">
            {isRecording ? (
              <button className="big-button" onClick={stopRecording}>
                ⏹ Stop ({elapsedSeconds}s)
              </button>
            ) : (
              <button className="big-button" onClick={startRecording} disabled={status === 'analyzing'}>
                {status === 'analyzing' ? 'Analyzing…' : '⏺ Start Recording'}
              </button>
            )}
            {isRecording && <span className="recorder-dot" aria-hidden="true" />}
          </div>

          {message && (
            <p className={`feedback ${status === 'error' ? 'incorrect' : 'correct'}`} style={{ fontSize: '0.95rem' }}>
              {message}
            </p>
          )}

          <div className="recorder-stats">
            <div className="recorder-stats-row">
              <span>
                {customCount} custom chord{customCount === 1 ? '' : 's'} stored
              </span>
              <span>
                {formatBytes(usageBytes)} / {formatBytes(capBytes)}
              </span>
            </div>
            <div className="recorder-bar">
              <div className="recorder-bar-fill" style={{ width: `${usageFraction * 100}%` }} />
            </div>
            <div className="recorder-actions">
              <button
                className="ghost-button"
                onClick={handleIncreaseCap}
                disabled={isAtMaxCap()}
              >
                {isAtMaxCap() ? 'At maximum storage' : 'Increase Storage Limit'}
              </button>
              {customCount > 0 && (
                <button className="ghost-button" onClick={handleClearAll}>
                  Clear My Recorded Chords
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
