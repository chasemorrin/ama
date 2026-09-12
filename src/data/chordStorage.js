// Custom-recorded chords are stored in IndexedDB rather than
// localStorage, since it can hold binary Blobs and comfortably handles
// many megabytes - localStorage is capped far too small (a few MB at
// most) and can only store strings.

const DB_NAME = 'chase-morrin-music-app'
const STORE_NAME = 'customChords'
const DB_VERSION = 1

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addCustomChord(blob) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const request = tx.objectStore(STORE_NAME).add({
      blob,
      size: blob.size,
      createdAt: Date.now(),
    })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllCustomChords() {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteCustomChord(id) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearAllCustomChords() {
  // Only ever touches this IndexedDB store - the bundled audio files
  // in src/assets/audio/tetrachords/ are static site assets living
  // entirely outside IndexedDB, so there is no code path here (or
  // anywhere else) that could delete them. This function can only ever
  // remove chords the user recorded themselves.
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getTotalStoredBytes() {
  const all = await getAllCustomChords()
  return all.reduce((sum, record) => sum + (record.size || 0), 0)
}

// --- Storage cap ---
// Starts modest and can be raised on request, up to a hard ceiling this
// app will never exceed regardless of how many times it's raised - a
// reasonable default rather than trying to claim a device's entire
// available storage.
const DEFAULT_CAP_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_CAP_BYTES = 50 * 1024 * 1024 // 50 MB
const CAP_KEY = 'chordStorageCapBytes'

export function getStorageCapBytes() {
  const stored = Number(localStorage.getItem(CAP_KEY))
  return stored > 0 ? Math.min(stored, MAX_CAP_BYTES) : DEFAULT_CAP_BYTES
}

export function isAtMaxCap() {
  return getStorageCapBytes() >= MAX_CAP_BYTES
}

export function increaseStorageCap() {
  const next = Math.min(getStorageCapBytes() * 2, MAX_CAP_BYTES)
  localStorage.setItem(CAP_KEY, String(next))
  return next
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`
}
