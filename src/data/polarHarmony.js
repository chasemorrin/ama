export const NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export const CHORD_QUALITIES = ['7', '-7', 'maj7', '6', '-6', '-b6', '-maj7', '(b6)']

// Each quality's polar opposite - a fixed pairing (applying it twice
// returns the original).
const QUALITY_POLAR_MAP = {
  7: '-6',
  '-7': '6',
  maj7: '-b6',
  6: '-7',
  '-6': '7',
  '-b6': 'maj7',
  '-maj7': '(b6)',
  '(b6)': '-maj7',
}

function mod12(n) {
  return ((n % 12) + 12) % 12
}

// Note test: start at the tonic, measure the interval up to the given
// note, then start a fifth above the tonic and go DOWN that same
// interval - the classic "negative harmony" mirror, reflecting around
// the axis halfway between the tonic and its fifth.
export function polarOppositeNote(tonicIndex, noteIndex) {
  const interval = mod12(noteIndex - tonicIndex)
  return mod12(tonicIndex + 7 - interval)
}

// Chord test: measure the interval from the tonic up to the chord's
// root, then go down that same interval starting from the tonic itself
// (no fifth offset this time) - a plain mirror around the tonic.
export function polarOppositeChordRoot(tonicIndex, rootIndex) {
  const interval = mod12(rootIndex - tonicIndex)
  return mod12(tonicIndex - interval)
}

export function polarOppositeQuality(quality) {
  return QUALITY_POLAR_MAP[quality]
}
