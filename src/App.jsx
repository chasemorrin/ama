import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import SingTetrachord from './pages/SingTetrachord.jsx'
import BrighterOrDarker from './pages/BrighterOrDarker.jsx'
import PolarHarmony from './pages/PolarHarmony.jsx'
import Drone from './pages/Drone.jsx'
import Claves from './pages/Claves.jsx'
import NotFound from './pages/NotFound.jsx'

// These two pull in VexFlow (a sizeable notation-rendering library), so
// they're loaded lazily - other pages shouldn't pay for it.
const RhythmPractice = lazy(() => import('./pages/RhythmPractice.jsx'))
const TetrachordMadness = lazy(() => import('./pages/TetrachordMadness.jsx'))

// HashRouter is used (URLs look like  .../#/brighter-or-darker ) instead of
// BrowserRouter on purpose: GitHub Pages serves static files with no
// server-side rewrite rules, so a plain BrowserRouter gives a 404 on any
// page refresh or shared link that isn't the home page. HashRouter needs
// zero server configuration and works out of the box once this is
// published to GitHub Pages. See README.md if you'd rather switch to
// clean URLs later.
export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/sing-tetrachord-in-harmony"
          element={<SingTetrachord />}
        />
        <Route path="/brighter-or-darker" element={<BrighterOrDarker />} />
        <Route path="/polar-harmony" element={<PolarHarmony />} />
        <Route path="/drone" element={<Drone />} />
        <Route path="/claves" element={<Claves />} />
        <Route
          path="/rhythm-practice"
          element={
            <Suspense fallback={<div className="page">Loading…</div>}>
              <RhythmPractice />
            </Suspense>
          }
        />
        <Route
          path="/tetrachord-madness"
          element={
            <Suspense fallback={<div className="page">Loading…</div>}>
              <TetrachordMadness />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  )
}
