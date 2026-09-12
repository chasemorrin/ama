// One measure of 12/8 = 12 eighth-note units. Every part fills that
// measure either by spacing N evenly-sized notes across it, or (for
// "abakua") by a fixed traditional pattern.

export const PART_OPTIONS = {
  sing: [3, 4, 6, 8],
  clap: [3, 4, 6, 'abakua'],
  step: [3, 4, 6, 8],
}

// Fixed abakua clap pattern: quarter, quarter, eighth, quarter, quarter,
// quarter, eighth - in eighth-note units: 2,2,1,2,2,2,1 (sums to 12).
const ABAKUA_UNITS = [2, 2, 1, 2, 2, 2, 1]

// Maps a note's length, in eighth-note units, to a VexFlow duration code.
const UNIT_TO_VEX_DURATION = {
  1: '8',
  1.5: '8d',
  2: '4',
  3: '4d',
  4: '2',
  6: '2d',
}

// Returns the list of note lengths (in eighth-note units) for a part's
// selected option - e.g. option 4 -> four notes of 3 units each
// (dotted quarters), option 'abakua' -> the fixed pattern above.
export function unitsForOption(option) {
  if (option === 'abakua') return ABAKUA_UNITS
  const n = Number(option)
  return Array(n).fill(12 / n)
}

export function vexDurationForUnits(units) {
  const code = UNIT_TO_VEX_DURATION[units]
  if (!code) {
    throw new Error(`No notation mapping for a ${units}-eighth-note-unit duration`)
  }
  return code
}

export function randomCombo() {
  const pick = (opts) => opts[Math.floor(Math.random() * opts.length)]
  return {
    sing: pick(PART_OPTIONS.sing),
    clap: pick(PART_OPTIONS.clap),
    step: pick(PART_OPTIONS.step),
  }
}

// Absolute start time (in eighth-note units, measured from the top of the
// measure) for every note in a part - used to schedule audio playback.
export function startTimesForOption(option) {
  const units = unitsForOption(option)
  const starts = []
  let t = 0
  for (const u of units) {
    starts.push(t)
    t += u
  }
  return { units, starts }
}
