import { Link } from 'react-router-dom'
import { exercises } from '../data/exercises.js'

export default function Home() {
  return (
    <div className="page">
      <div className="hero">
        <h1 className="wordmark">
          <span className="w1">Chase Morrin's</span>{' '}
          <span className="w2">Awesome</span> <span className="w3">Music</span>{' '}
          <span className="w4">App</span>
        </h1>
        <p className="sub">
          Pick a pad below to start an ear training or theory exercise.
        </p>
      </div>

      <div className="pad-grid">
        {exercises.map((ex) => (
          <Link key={ex.slug} to={`/${ex.slug}`} className={`pad pad-${ex.color}`}>
            <span className="pad-note">{ex.note}</span>
            <div>
              <div className="pad-title">{ex.title}</div>
              <div className="pad-tag">{ex.tagline}</div>
            </div>
          </Link>
        ))}

        <div className="pad pad-more">
          More exercises coming soon
        </div>
      </div>
    </div>
  )
}
