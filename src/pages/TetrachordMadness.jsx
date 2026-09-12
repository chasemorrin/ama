import { useState } from 'react'
import ExerciseTopbar from '../components/ExerciseTopbar.jsx'
import SingleTetrachordTab from '../components/SingleTetrachordTab.jsx'
import TetrachordPatternTab from '../components/TetrachordPatternTab.jsx'
import LowerUpperTab from '../components/LowerUpperTab.jsx'
import CustomGeneratorTab from '../components/CustomGeneratorTab.jsx'

const TABS = [
  { key: 'single', label: 'Single Tetrachord', Component: SingleTetrachordTab },
  { key: 'pattern', label: 'Tetrachord Pattern', Component: TetrachordPatternTab },
  { key: 'lowerUpper', label: 'Lower and Uppers', Component: LowerUpperTab },
  { key: 'custom', label: 'Custom Generator', Component: CustomGeneratorTab },
]

export default function TetrachordMadness() {
  const [tabKey, setTabKey] = useState('single')
  const ActiveTab = TABS.find((t) => t.key === tabKey).Component

  const tabs = (
    <>
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          className={`nav-tab${tabKey === key ? ' active' : ''}`}
          onClick={() => setTabKey(key)}
        >
          {label}
        </button>
      ))}
    </>
  )

  return (
    <>
      <ExerciseTopbar title="Tetrachord Madness" tabs={tabs} />
      <div className="page">
        <ActiveTab />
      </div>
    </>
  )
}
