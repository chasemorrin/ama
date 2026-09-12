import { useEffect, useRef } from 'react'
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Dot,
  BarlineType,
} from 'vexflow'
import { unitsForOption, vexDurationForUnits } from '../data/rhythm.js'

const STAFF_WIDTH = 560
const STAFF_HEIGHT = 110

export default function RhythmStaff({ option }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(STAFF_WIDTH, STAFF_HEIGHT)
    const context = renderer.getContext()

    const stave = new Stave(10, 12, STAFF_WIDTH - 20)
    stave.setBegBarType(BarlineType.REPEAT_BEGIN)
    stave.setEndBarType(BarlineType.REPEAT_END)
    stave.addTimeSignature('12/8')
    stave.setContext(context).draw()

    const units = unitsForOption(option)
    const notes = units.map((u) => {
      const duration = vexDurationForUnits(u)
      const note = new StaveNote({
        keys: ['b/4'],
        duration,
        stem_direction: 1,
      })
      if (duration.endsWith('d')) {
        Dot.buildAndAttach([note], { all: true })
      }
      return note
    })

    const voice = new Voice({ num_beats: 12, beat_value: 8 })
    voice.addTickables(notes)

    new Formatter().joinVoices([voice]).format([voice], STAFF_WIDTH - 90)
    voice.draw(context, stave)

    const svg = el.querySelector('svg')
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${STAFF_WIDTH} ${STAFF_HEIGHT}`)
      svg.setAttribute('width', '100%')
      svg.removeAttribute('height')
      svg.style.height = 'auto'
      svg.style.display = 'block'
    }
  }, [option])

  return <div className="rhythm-staff" ref={containerRef} />
}
