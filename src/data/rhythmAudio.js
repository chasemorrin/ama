// Lightweight synthesized sounds - no audio files needed. Each function
// schedules its sound to start at an exact AudioContext time, which is
// what makes the polyrhythm playback sample-accurate regardless of any
// jitter in the JavaScript timer that scheduled it.
//
// Every function takes an optional `destination` node to connect to
// (defaults to ctx.destination). The rhythm player routes all sound
// through a single master gain node instead, so that stopping playback
// can silence everything already scheduled in one instant move, rather
// than waiting for each note's own release tail to finish.

let sharedNoiseBuffer = null
function getNoiseBuffer(ctx) {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer
  }
  const length = ctx.sampleRate * 0.3
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  sharedNoiseBuffer = buffer
  return buffer
}

// STEP: a short synthesized bass-drum thump.
export function triggerKick(ctx, time, destination) {
  const dest = destination || ctx.destination
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(150, time)
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.1)
  gain.gain.setValueAtTime(0.9, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18)
  osc.connect(gain).connect(dest)
  osc.start(time)
  osc.stop(time + 0.2)
}

// CLAP: a filtered burst of noise.
export function triggerClap(ctx, time, destination) {
  const dest = destination || ctx.destination
  const noise = ctx.createBufferSource()
  noise.buffer = getNoiseBuffer(ctx)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 1500
  bandpass.Q.value = 0.9
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.8, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16)
  noise.connect(bandpass).connect(gain).connect(dest)
  noise.start(time)
  noise.stop(time + 0.2)
}

// CLAVE: a simple metronome-style woodblock click. Real woodblocks (and
// most metronome click samples) are a very short, resonant "tock" - a
// couple of quickly-decaying tones giving the wood-like pitch, plus a
// brief filtered noise transient for the percussive attack snap. A
// buzzy oscillator sweep (the previous version) reads as electronic
// rather than woody, so this leans on decay speed and noise instead.
export function triggerClave(ctx, time, destination) {
  const dest = destination || ctx.destination

  const partials = [
    { freq: 1800, gain: 0.5, decay: 0.05 },
    { freq: 2700, gain: 0.22, decay: 0.03 },
  ]
  partials.forEach(({ freq, gain, decay }) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)
    const oscGain = ctx.createGain()
    oscGain.gain.setValueAtTime(gain, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + decay)
    osc.connect(oscGain).connect(dest)
    osc.start(time)
    osc.stop(time + decay + 0.01)
  })

  // A very short filtered-noise "tick" for the attack transient.
  const noise = ctx.createBufferSource()
  noise.buffer = getNoiseBuffer(ctx)
  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = 2000
  bandpass.Q.value = 2.5
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(0.3, time)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.015)
  noise.connect(bandpass).connect(noiseGain).connect(dest)
  noise.start(time)
  noise.stop(time + 0.02)
}

// SING: a synthesized piano-ish tone (defaults to middle C, 261.63 Hz),
// held for the note's duration. A real piano tone is built from several
// harmonics above the fundamental, and - unlike an organ or a sustained
// sine wave - it keeps decaying in volume the whole time a key is held,
// rather than sitting at a flat sustain level. Both of those are what
// give this its piano character instead of sounding like a plain
// electronic beep.
const PIANO_PARTIALS = [
  { ratio: 1, gain: 1.0, type: 'triangle' },
  { ratio: 2, gain: 0.34, type: 'sine' },
  { ratio: 3, gain: 0.18, type: 'sine' },
  { ratio: 4, gain: 0.09, type: 'sine' },
  { ratio: 6, gain: 0.04, type: 'sine' },
]

export function triggerSing(ctx, time, durationSeconds, destination, frequency = 261.63, release = 0.09) {
  const dest = destination || ctx.destination
  const fundamental = frequency
  const attack = 0.008
  // The note rings for its rhythmic duration PLUS this release tail. A
  // short release (the default) keeps a fast rhythm's onsets clean; a
  // long release lets the tail overlap into the next note - like a
  // legato pianist not quite lifting a finger before the next key - so
  // the tone actually sustains instead of sounding like a short beep.
  const ringDuration = durationSeconds + release

  const noteGain = ctx.createGain()
  noteGain.gain.setValueAtTime(0, time)
  noteGain.gain.linearRampToValueAtTime(0.55, time + attack)
  // Continuous decay across the note, like a real hammer-struck string.
  noteGain.gain.exponentialRampToValueAtTime(0.0006, time + ringDuration)
  noteGain.connect(dest)

  PIANO_PARTIALS.forEach(({ ratio, gain, type }) => {
    const osc = ctx.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(fundamental * ratio, time)
    const partialGain = ctx.createGain()
    partialGain.gain.value = gain
    osc.connect(partialGain).connect(noteGain)
    osc.start(time)
    osc.stop(time + ringDuration + 0.05)
  })

  // A very short, quiet noise "click" at the very start approximates the
  // hammer strike transient that gives a piano its percussive attack.
  const click = ctx.createBufferSource()
  click.buffer = getNoiseBuffer(ctx)
  const clickFilter = ctx.createBiquadFilter()
  clickFilter.type = 'highpass'
  clickFilter.frequency.value = 2500
  const clickGain = ctx.createGain()
  clickGain.gain.setValueAtTime(0.12, time)
  clickGain.gain.exponentialRampToValueAtTime(0.0005, time + 0.02)
  click.connect(clickFilter).connect(clickGain).connect(dest)
  click.start(time)
  click.stop(time + 0.03)
}
