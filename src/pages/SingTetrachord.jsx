import { useEffect, useMemo, useRef, useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import ChordRecorder from '../components/ChordRecorder.jsx'
import { getAllCustomChords } from '../data/chordStorage.js'

// Every audio file dropped into src/assets/audio/tetrachords/ is picked up
// automatically at build time - no code changes needed when you add more
// recordings. Supported formats: mp3, wav, m4a, ogg.
//
// These are compiled directly into the site as static files - permanent
// app content, never touched by anything in ChordRecorder. Only
// user-recorded chords (stored separately in IndexedDB, see
// data/chordStorage.js) can ever be cleared or deleted.
const audioModules = import.meta.glob(
  '../assets/audio/tetrachords/*.{mp3,wav,m4a,ogg,MP3,WAV,M4A,OGG}',
  { eager: true, import: 'default' }
)
const bundledClips = Object.values(audioModules)

const MODES = [
  { key: 'all', label: 'Play all chords at random' },
  { key: 'base', label: 'Play base chords at random' },
  { key: 'mine', label: 'Play only my chords at random' },
]

export default function SingTetrachord() {
  const [mode, setMode] = useState('all')
  const [currentClip, setCurrentClip] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [customClipUrls, setCustomClipUrls] = useState([])
  const [reloadToken, setReloadToken] = useState(0)
  const audioRef = useRef(null)

  // Custom chords live in IndexedDB as Blobs - loading them means turning
  // each one into a playable object URL. Those URLs are only valid for
  // this page's lifetime, so they're revoked on cleanup/reload rather
  // than leaking memory.
  useEffect(() => {
    let isCurrent = true
    let createdUrls = []

    getAllCustomChords().then((records) => {
      if (!isCurrent) return
      createdUrls = records.map((r) => URL.createObjectURL(r.blob))
      setCustomClipUrls(createdUrls)
    })

    return () => {
      isCurrent = false
      createdUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [reloadToken])

  const allClips = useMemo(
    () => [...bundledClips, ...customClipUrls],
    [customClipUrls]
  )

  const activeClips = useMemo(() => {
    if (mode === 'base') return bundledClips
    if (mode === 'mine') return customClipUrls
    return allClips
  }, [mode, customClipUrls, allClips])

  const hasClips = activeClips.length > 0

  // Switching pools invalidates whatever was queued up for "Play Again",
  // since it might belong to a different pool than the one now selected.
  useEffect(() => {
    setCurrentClip(null)
  }, [mode])

  const play = (src) => {
    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    audio.pause()
    audio.src = src
    audio.currentTime = 0
    setIsPlaying(true)
    audio.onended = () => setIsPlaying(false)
    audio.play().catch(() => setIsPlaying(false))
  }

  const playRandomChord = () => {
    if (!hasClips) return
    let next = currentClip
    if (activeClips.length > 1) {
      // avoid repeating the same clip twice in a row
      while (next === currentClip) {
        next = activeClips[Math.floor(Math.random() * activeClips.length)]
      }
    } else {
      next = activeClips[0]
    }
    setCurrentClip(next)
    play(next)
  }

  const playAgain = () => {
    if (currentClip) play(currentClip)
  }

  const emptyMessage =
    mode === 'mine' ? (
      <p className="empty-state">
        You haven't recorded any chords yet. Use{' '}
        <strong>Upload My Own Chords</strong> below to add some.
      </p>
    ) : (
      <p className="empty-state">
        No chord recordings yet. Drop your 2-second audio clips into{' '}
        <code>src/assets/audio/tetrachords/</code> (mp3, wav, m4a, or ogg),
        then rebuild the site, or record some of your own below.
      </p>
    )

  return (
    <>
      <ExerciseTopbar title="Sing Tetrachord in Harmony" />
      <div className="page">
        <div className="choice-row" style={{ marginTop: 8 }}>
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              className={`choice-pill${mode === key ? ' selected' : ''}`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="card">
          {hasClips ? (
            <>
              <button className="big-button" onClick={playRandomChord}>
                Play a Chord at Random
              </button>

              <button
                className="ghost-button"
                onClick={playAgain}
                disabled={!currentClip}
              >
                Play Again
              </button>

              <div className="now-playing" aria-hidden={!isPlaying}>
                {isPlaying && (
                  <>
                    <span />
                    <span />
                    <span />
                  </>
                )}
              </div>
            </>
          ) : (
            emptyMessage
          )}
        </div>

        <div className="card">
          <ChordRecorder onChordsChanged={() => setReloadToken((t) => t + 1)} />
        </div>
      </div>
    </>
  )
}
