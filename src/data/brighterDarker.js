// Spelled note names available to draw from. Enharmonic spellings (C#/Db
// etc.) are kept as separate entries so students see the same variety of
// spellings a teacher would use, but each carries the correct shared
// pitch value below.
export const NOTES = [
  { name: 'C', value: 0 },
  { name: 'C#', value: 1 },
  { name: 'Db', value: 1 },
  { name: 'D', value: 2 },
  { name: 'D#', value: 3 },
  { name: 'Eb', value: 3 },
  { name: 'E', value: 4 },
  { name: 'F', value: 5 },
  { name: 'F#', value: 6 },
  { name: 'Gb', value: 6 },
  { name: 'G', value: 7 },
  { name: 'G#', value: 8 },
  { name: 'Ab', value: 8 },
  { name: 'A', value: 9 },
  { name: 'A#', value: 10 },
  { name: 'Bb', value: 10 },
  { name: 'B', value: 11 },
]

// A distinct accent color per pitch class, cycling through the app's
// palette - purely decorative, keeps the key chips visually lively.
const PITCH_COLORS = [
  'var(--pink)',
  'var(--blue)',
  'var(--yellow)',
  'var(--teal)',
  'var(--violet)',
]
export function colorForValue(value) {
  return PITCH_COLORS[value % PITCH_COLORS.length]
}

// result = value1 - value2, normalized into 0..11 by taking it mod 12
// (so e.g. -4 and 8 both normalize to 8). This table encodes the
// brighter/darker mapping exactly as specified: how many steps and
// which direction. `either: true` marks the tritone (6), where both
// directions are equally correct.
const RESULT_TABLE = {
  1: { steps: 5, direction: 'brighter' },
  2: { steps: 2, direction: 'darker' },
  3: { steps: 3, direction: 'brighter' },
  4: { steps: 4, direction: 'darker' },
  5: { steps: 1, direction: 'brighter' },
  6: { steps: 6, direction: 'either' },
  7: { steps: 1, direction: 'darker' },
  8: { steps: 4, direction: 'brighter' },
  9: { steps: 3, direction: 'darker' },
  10: { steps: 2, direction: 'brighter' },
  11: { steps: 5, direction: 'darker' },
}

export function normalizedResult(value1, value2) {
  return ((value1 - value2) % 12 + 12) % 12
}

export function getAnswer(value1, value2) {
  const r = normalizedResult(value1, value2)
  return RESULT_TABLE[r] // undefined only if value1 === value2, which callers avoid
}

// Picks two random notes whose pitch VALUES differ (so a result of 0,
// i.e. "the same key", never comes up).
export function randomKeyPair() {
  const first = NOTES[Math.floor(Math.random() * NOTES.length)]
  let second = first
  while (second.value === first.value) {
    second = NOTES[Math.floor(Math.random() * NOTES.length)]
  }
  return [first, second]
}
