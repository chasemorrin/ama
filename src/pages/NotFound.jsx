import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <div className="topbar" style={{ padding: 0, marginBottom: 24 }}>
        <Link to="/" className="home-link">
          ← Home
        </Link>
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)' }}>Page not found</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        That exercise doesn't exist yet. Head back home and pick a pad.
      </p>
    </div>
  )
}
