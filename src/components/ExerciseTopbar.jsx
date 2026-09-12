import { Link } from 'react-router-dom'

// `tabs`, when provided, renders on the same row as the title on wide
// screens (flowing to the right of it), and wraps to its own row below
// on narrow screens - handled purely in CSS via flex-wrap, see .topbar
// in index.css.
export default function ExerciseTopbar({ title, tabs }) {
  return (
    <div className="topbar">
      <div className="topbar-titlegroup">
        <Link to="/" className="home-link">
          ← Home
        </Link>
        <span className="exercise-heading">{title}</span>
      </div>
      {tabs && <div className="topbar-tabs">{tabs}</div>}
    </div>
  )
}
