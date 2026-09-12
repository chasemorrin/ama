const BIN_ID = '6a83dd8cf5f4af5e2922d3d6'
const ACCESS_KEY = import.meta.env.VITE_JSONBIN_ACCESS_KEY

// This only ever issues a GET request - there is no create/update/delete
// call anywhere in this file (or anywhere else in the app). The access
// key it uses should be a read-only key scoped to this one bin, set via
// the VITE_JSONBIN_ACCESS_KEY environment variable (see README.md) -
// never the account's master key.
export async function fetchClavePresets() {
  if (!ACCESS_KEY) {
    throw new Error(
      'Missing JSONBin access key - set VITE_JSONBIN_ACCESS_KEY in your .env file.'
    )
  }

  const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
    headers: { 'X-Access-Key': ACCESS_KEY },
  })

  if (!response.ok) {
    throw new Error(`JSONBin request failed (${response.status})`)
  }

  const data = await response.json()
  const record = data.record || {}

  // The bin stores presets as a { "Preset Name": { bpm, numSteps, steps } }
  // map - turned into a stable ordered array for rendering.
  return Object.entries(record).map(([name, preset]) => ({
    name,
    bpm: preset.bpm,
    numSteps: preset.numSteps,
    steps: preset.steps,
  }))
}
