// Averages all channels down to one, for simple amplitude analysis.
function getMonoData(buffer) {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0)
  const mono = new Float32Array(buffer.length)
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < buffer.length; i++) {
      mono[i] += data[i] / buffer.numberOfChannels
    }
  }
  return mono
}

// Splits a longer recording into separate "chord" segments, using onset
// detection: find where each chord starts (a stretch of sound following
// enough quiet to count as a new attack), then extend each one all the
// way to right before the NEXT chord's onset - rather than trimming the
// instant its own volume dips. That's deliberate: a played chord keeps
// decaying in volume the whole time it's held (true of a real piano),
// so cutting the clip at the first quiet moment would truncate it long
// before the person actually let go. The one exception is the very last
// chord, which has no "next onset" to extend to, so it's trimmed a bit
// after its own natural decay instead.
export function detectChordSegments(
  buffer,
  {
    windowMs = 50,
    silenceGapMs = 220,
    minSegmentMs = 150,
    prePaddingMs = 40,
    tailPaddingMs = 150,
    relativeThreshold = 0.12,
  } = {}
) {
  const sampleRate = buffer.sampleRate
  const mono = getMonoData(buffer)
  const windowSize = Math.max(1, Math.floor((sampleRate * windowMs) / 1000))
  const numWindows = Math.ceil(mono.length / windowSize)

  const rms = new Float32Array(numWindows)
  let peak = 0
  for (let w = 0; w < numWindows; w++) {
    const start = w * windowSize
    const end = Math.min(start + windowSize, mono.length)
    let sum = 0
    for (let i = start; i < end; i++) sum += mono[i] * mono[i]
    const value = Math.sqrt(sum / Math.max(1, end - start))
    rms[w] = value
    if (value > peak) peak = value
  }

  if (peak === 0) return [] // dead silence throughout - nothing to find

  const threshold = peak * relativeThreshold
  const isSound = Array.from(rms, (v) => v > threshold)

  // Find raw runs of "sound" windows.
  const rawRuns = []
  let runStart = null
  for (let w = 0; w < numWindows; w++) {
    if (isSound[w] && runStart === null) runStart = w
    if (!isSound[w] && runStart !== null) {
      rawRuns.push([runStart, w])
      runStart = null
    }
  }
  if (runStart !== null) rawRuns.push([runStart, numWindows])

  // Bridge over gaps shorter than silenceGapMs (a natural dip inside one
  // held chord shouldn't count as a break between two chords).
  const gapWindows = Math.ceil(silenceGapMs / windowMs)
  const mergedRuns = []
  for (const run of rawRuns) {
    const prev = mergedRuns[mergedRuns.length - 1]
    if (prev && run[0] - prev[1] <= gapWindows) {
      prev[1] = run[1]
    } else {
      mergedRuns.push([...run])
    }
  }

  const minSegmentSamples = Math.floor((sampleRate * minSegmentMs) / 1000)
  const validRuns = mergedRuns.filter(
    ([wStart, wEnd]) => (wEnd - wStart) * windowSize >= minSegmentSamples
  )
  if (validRuns.length === 0) return []

  const prePadSamples = Math.floor((sampleRate * prePaddingMs) / 1000)
  const tailPadSamples = Math.floor((sampleRate * tailPaddingMs) / 1000)
  const onsets = validRuns.map(([wStart]) => wStart * windowSize)

  return validRuns.map(([, wEnd], i) => {
    const startSample = Math.max(0, onsets[i] - prePadSamples)
    const isLast = i === validRuns.length - 1
    const endSample = isLast
      ? Math.min(mono.length, wEnd * windowSize + tailPadSamples)
      : Math.max(startSample + 1, onsets[i + 1] - prePadSamples)
    return { startSample, endSample }
  })
}

// Copies one sample range out of a larger AudioBuffer into its own
// standalone AudioBuffer.
export function sliceAudioBuffer(buffer, startSample, endSample) {
  const length = endSample - startSample
  const sliced = new AudioBuffer({
    numberOfChannels: buffer.numberOfChannels,
    length,
    sampleRate: buffer.sampleRate,
  })
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    sliced.copyToChannel(buffer.getChannelData(ch).subarray(startSample, endSample), ch)
  }
  return sliced
}

// Encodes an AudioBuffer as a 16-bit PCM WAV Blob. Browsers can decode
// almost anything, but there's no built-in encoder for turning an
// AudioBuffer back into a storable file - WAV is the simplest format to
// write by hand, so that's what recorded chords are stored as.
export function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const dataSize = buffer.length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  const channelData = []
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch))

  let offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
