export const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const LETTER_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

export const PRESET_PROGRESSIONS = {
  'ii-V-I': 'D-7, G7, Cmaj7',
  '4ths': 'Cmaj7, Fmaj7, B-7b5, E-7, A-7, D-7, G7, Cmaj7',
  '3rds': 'Cmaj7, E-7, G7, B-7b5, D-7, Fmaj7, A-7, Cmaj7',
  '2nds': 'Cmaj7, D-7, E-7, Fmaj7, G7, A-7, B-7b5, Cmaj7',
}

// Parses one chord token like "D-7", "B-7b5", "Cmaj7" (case-insensitive
// root letter, whitespace trimmed) into its pitch-class index plus the
// root spelling and quality as originally typed - or null if the root
// letter itself isn't recognizable. The quality suffix is otherwise
// unrestricted, so custom progressions can use any quality text.
export function parseChordToken(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const match = /^([A-Ga-g])([b#]?)(.*)$/.exec(trimmed)
  if (!match) return null
  const letter = match[1].toUpperCase()
  const accidental = match[2]
  const quality = match[3]
  let semitone = LETTER_SEMITONES[letter]
  if (accidental === '#') semitone += 1
  if (accidental === 'b') semitone -= 1
  semitone = ((semitone % 12) + 12) % 12
  return {
    rootIndex: semitone,
    rootDisplay: `${letter}${accidental}`,
    quality,
    raw: trimmed,
  }
}

// Parses a full comma-separated progression, returning the valid chords
// plus a list of anything that couldn't be understood.
export function parseProgression(text) {
  const chords = []
  const invalid = []
  text.split(',').forEach((raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const parsed = parseChordToken(trimmed)
    if (parsed) chords.push(parsed)
    else invalid.push(trimmed)
  })
  return { chords, invalid }
}

// Three-tonic system: divides the octave into 3 equal major-third steps
// (0, 4, 8 semitones) - the "augmented scale" symmetric division.
// Four-tonic system: divides the octave into 4 equal minor-third steps
// (0, 3, 6, 9 semitones) - the "diminished scale" symmetric division.
// "up"/"down" are relative to the original root; the halfway tritone
// step only exists in the 4-tonic system, since 3 doesn't divide evenly
// around a symmetric up/down/same split the way 4 does.
export const SUBSTITUTION_SYSTEMS = {
  3: {
    label: '3 Tonic',
    intervalName: 'major 3rd',
    steps: [
      { offset: 0, color: 'neutral' },
      { offset: 4, color: 'up' },
      { offset: 8, color: 'down' },
    ],
  },
  4: {
    label: '4 Tonic',
    intervalName: 'minor 3rd',
    steps: [
      { offset: 0, color: 'neutral' },
      { offset: 3, color: 'up' },
      { offset: 6, color: 'tritone' },
      { offset: 9, color: 'down' },
    ],
  },
}

// Randomly substitutes every chord except the last (which stays fixed
// as the progression's resolution) with another chord from the chosen
// symmetric system, keeping the same quality throughout.
export function generateSubstitution(chords, systemKey) {
  const system = SUBSTITUTION_SYSTEMS[systemKey]
  return chords.map((chord, i) => {
    if (i === chords.length - 1) {
      return { rootDisplay: chord.rootDisplay, quality: chord.quality, color: 'neutral' }
    }
    const step = system.steps[Math.floor(Math.random() * system.steps.length)]
    const newRootIndex = ((chord.rootIndex + step.offset) % 12 + 12) % 12
    return { rootDisplay: NOTE_NAMES[newRootIndex], quality: chord.quality, color: step.color }
  })
}
