// A tetrachord here is 4 notes on scale degrees 1-4, altered to produce
// four different qualities. Each quality has a "lower" spelling (built
// on C, like the original Tetrachord Madness page: C,D,E,F) and an
// "upper" spelling (built on G: G,A,B,C) - the same interval pattern
// transposed up a fourth, so a lower tetrachord and its upper partner
// stack together into a full octave (C to C) the way they do in a
// traditional scale built from two tetrachords.
export const TETRACHORD_TYPES = {
  major: { label: 'Major', lower: ['C', 'D', 'E', 'F'], upper: ['G', 'A', 'B', 'C'] },
  minor: { label: 'Minor', lower: ['C', 'D', 'Eb', 'F'], upper: ['G', 'A', 'Bb', 'C'] },
  phrygian: { label: 'Phrygian', lower: ['C', 'Db', 'Eb', 'F'], upper: ['G', 'Ab', 'Bb', 'C'] },
  augmented: { label: 'Augmented', lower: ['C', 'D', 'E', 'F#'], upper: ['G', 'A', 'B', 'C#'] },
}

export const INVERSIONS = ['A1', 'A2', 'A3', 'A4']
export const UPPER_INVERSIONS = ['B1', 'B2', 'B3', 'B4']

// Inversion n (0-based: A1=0 ... A4=3) rotates the 4 scale degrees to
// start on a different note, octave-shifting whichever notes wrapped
// around - e.g. A3 (n=2) turns degrees [0,1,2,3] into E,F,C(+1),D(+1).
export function inversionOrder(n) {
  const order = []
  for (let i = 0; i < 4; i++) {
    const shifted = i + n
    order.push({
      degreeIndex: shifted % 4,
      octaveShift: shifted >= 4 ? 1 : 0,
    })
  }
  return order
}

// All 24 orderings of the positions [0,1,2,3], generated once in a
// stable order so "permutation 7" always means the same rearrangement.
function permute(arr) {
  if (arr.length <= 1) return [arr]
  const result = []
  arr.forEach((item, i) => {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    permute(rest).forEach((p) => result.push([item, ...p]))
  })
  return result
}
export const PERMUTATIONS = permute([0, 1, 2, 3])

// Base octave for each scale degree, before any inversion-driven shift.
// Lower (C,D,E,F) all sit in the octave containing middle C. Upper
// (G,A,B,C) has G/A/B in that same octave, but its C is already the one
// above - that's simply what it means for G-A-B-C to sit a fourth above
// middle C.
const REGISTER_BASE_OCTAVES = {
  lower: [4, 4, 4, 4],
  upper: [4, 4, 4, 5],
}

// Combines an inversion, a permutation, a tetrachord type, and a
// register (lower/upper) into the final ordered list of { name, octave }
// notes to notate and play.
// Core logic shared by buildTetrachord (named qualities) and
// buildTetrachordFromNotes (arbitrary/non-traditional spellings): turns
// an inversion + permutation + a 4-note spelling into the final ordered
// { name, octave } list.
function applyInversionAndPermutation({ inversionIndex, permutationIndex, noteNames, register }) {
  const order = inversionOrder(inversionIndex)
  const reordered = PERMUTATIONS[permutationIndex].map((posIndex) => order[posIndex])
  const baseOctaves = REGISTER_BASE_OCTAVES[register]
  return reordered.map(({ degreeIndex, octaveShift }) => ({
    name: noteNames[degreeIndex],
    octave: baseOctaves[degreeIndex] + octaveShift,
  }))
}

export function buildTetrachord({
  inversionIndex,
  permutationIndex,
  tetrachordType,
  register = 'lower',
}) {
  const noteNames = TETRACHORD_TYPES[tetrachordType][register]
  return applyInversionAndPermutation({ inversionIndex, permutationIndex, noteNames, register })
}

// Same as buildTetrachord, but for a raw 4-note spelling rather than a
// named quality - used by the "More" non-traditional tetrachords on the
// Single Tetrachord tab.
export function buildTetrachordFromNotes({
  inversionIndex,
  permutationIndex,
  noteNames,
  register = 'lower',
}) {
  return applyInversionAndPermutation({ inversionIndex, permutationIndex, noteNames, register })
}

// Non-traditional tetrachords (lower register only) - spelled directly
// rather than named, offered as extra options beyond the four main
// qualities.
export const EXTRA_LOWER_TETRACHORDS = [
  ['C', 'Db', 'Ebb', 'Fbb'],
  ['C', 'Db', 'Ebb', 'Fb'],
  ['C', 'Db', 'Ebb', 'F'],
  ['C', 'Db', 'Ebb', 'F#'],
  ['C', 'Db', 'Eb', 'E'],
  ['C', 'Db', 'Eb', 'F#'],
  ['C', 'Db', 'E', 'F'],
  ['C', 'Db', 'E', 'F#'],
  ['C', 'Db', 'E#', 'F#'],
  ['C', 'D', 'Eb', 'F#'],
  ['C', 'D', 'E#', 'F#'],
]

// A1, A2, A3, A4 (each voiced with the same permutation), followed by
// the same four inversions backwards in reverse order and each played
// in retrograde: A4 backwards, A3 backwards, A2 backwards, A1 backwards.
export function buildTetrachordPattern({ permutationIndex, tetrachordType }) {
  const forward = [0, 1, 2, 3].map((inversionIndex) => ({
    label: INVERSIONS[inversionIndex],
    notes: buildTetrachord({ inversionIndex, permutationIndex, tetrachordType }),
  }))
  const retrograde = [3, 2, 1, 0].map((inversionIndex) => ({
    label: INVERSIONS[inversionIndex],
    notes: [...buildTetrachord({ inversionIndex, permutationIndex, tetrachordType })].reverse(),
  }))
  return [...forward, ...retrograde]
}

// A1, B1, A2, B2, A3, B3, A4, B4 - the lower and upper tetrachords
// interleaved by inversion number, sharing one permutation but each
// with its own independently-chosen quality - followed by that whole
// 8-chord sequence backwards, with each individual tetrachord also
// played in retrograde.
export function buildLowerUpperPattern({
  permutationIndex,
  lowerTetrachordType,
  upperTetrachordType,
}) {
  const forward = []
  for (let inversionIndex = 0; inversionIndex < 4; inversionIndex++) {
    forward.push({
      label: INVERSIONS[inversionIndex],
      notes: buildTetrachord({
        inversionIndex,
        permutationIndex,
        tetrachordType: lowerTetrachordType,
        register: 'lower',
      }),
    })
    forward.push({
      label: UPPER_INVERSIONS[inversionIndex],
      notes: buildTetrachord({
        inversionIndex,
        permutationIndex,
        tetrachordType: upperTetrachordType,
        register: 'upper',
      }),
    })
  }
  const retrograde = [...forward]
    .reverse()
    .map((measure) => ({ label: measure.label, notes: [...measure.notes].reverse() }))
  return [...forward, ...retrograde]
}

// Converts { name: 'F#', octave: 5 } into a VexFlow key string ('f#/5')
// plus the accidental code to attach ('#' / 'b' / null).
export function toVexKey(note) {
  const letter = note.name[0].toLowerCase()
  const accidental = note.name.length > 1 ? note.name.slice(1) : null
  return {
    vexKey: `${letter}${accidental || ''}/${note.octave}`,
    accidental,
  }
}

// Concert pitch in Hz (A4 = 440Hz, equal temperament) - used for playback.
const SEMITONES_FROM_C = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
export function noteToFrequency(note) {
  const letter = note.name[0]
  const accidental = note.name.slice(1) // '', '#', 'b', '##', 'bb', ...
  let semitone = SEMITONES_FROM_C[letter]
  // Count every sharp/flat character rather than just checking whether
  // one is present - a double flat ('bb') needs to shift the pitch down
  // two semitones, not one.
  for (const ch of accidental) {
    if (ch === '#') semitone += 1
    else if (ch === 'b') semitone -= 1
  }
  const semitonesFromA4 = semitone - 9 + (note.octave - 4) * 12
  return 440 * Math.pow(2, semitonesFromA4 / 12)
}

// Parses a single token like "a1", "B3" (case-insensitive, whitespace
// trimmed) into { register, inversionIndex, label }, or null if it
// doesn't match the A1-A4 / B1-B4 shape.
export function parseSequenceToken(raw) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const match = /^([ab])([1-4])$/i.exec(trimmed)
  if (!match) return null
  const letter = match[1].toUpperCase()
  return {
    register: letter === 'A' ? 'lower' : 'upper',
    inversionIndex: Number(match[2]) - 1,
    label: `${letter}${match[2]}`,
  }
}

// Parses a comma-separated sequence like "A1, B2, a3" into the list of
// valid tokens plus a list of anything that couldn't be understood
// (so the UI can gently point those out rather than silently dropping
// them).
export function parseSequenceInput(text) {
  const tokens = []
  const invalid = []
  text.split(',').forEach((raw) => {
    const trimmed = raw.trim()
    if (!trimmed) return
    const parsed = parseSequenceToken(trimmed)
    if (parsed) tokens.push(parsed)
    else invalid.push(trimmed)
  })
  return { tokens, invalid }
}
