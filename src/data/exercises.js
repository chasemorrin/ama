// Central list of exercises. The home page pads are generated from this
// file, so adding a new exercise means: add an entry here, add the page
// component in src/pages/, and add a matching <Route> in App.jsx.
//
// `color` must be one of the pad-* classes defined in index.css:
// pink | blue | yellow | teal | violet

export const exercises = [
  {
    slug: 'sing-tetrachord-in-harmony',
    title: 'Sing Tetrachord in Harmony',
    tagline: 'Hear a random chord, then sing it back',
    color: 'pink',
    note: '♪',
  },
  {
    slug: 'brighter-or-darker',
    title: 'Brighter or Darker',
    tagline: 'Judge the distance between two keys',
    color: 'blue',
    note: '♭♯',
  },
  {
    slug: 'rhythm-practice',
    title: 'Rhythm Practice',
    tagline: 'Sing, clap, and step live polyrhythms',
    color: 'teal',
    note: '𝅗𝅥',
  },
  {
    slug: 'tetrachord-madness',
    title: 'Tetrachord Madness',
    tagline: 'Inversions, permutations, and tetrachord types',
    color: 'violet',
    note: '𝄞',
  },
  {
    slug: 'polar-harmony',
    title: 'Polar Harmony',
    tagline: 'Find the polar opposite of a note or chord',
    color: 'yellow',
    note: '⇄',
  },
  {
    slug: 'drone',
    title: 'Drone',
    tagline: 'A continuous reference pitch on any tonic',
    color: 'coral',
    note: '〜',
  },
  {
    slug: 'claves',
    title: 'Claves',
    tagline: 'Play your saved metronome patterns on loop',
    color: 'blue',
    note: '▤',
  },
  {
    slug: 'polytonic-modifications',
    title: 'Polytonic Modifications',
    tagline: 'Generate symmetric chord substitutions for any progression',
    color: 'pink',
    note: '♬',
  },
]
