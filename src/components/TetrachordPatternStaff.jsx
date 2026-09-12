import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Accidental,
  BarlineType,
} from 'vexflow'
import { toVexKey } from '../data/tetrachord.js'

const MEASURES_PER_ROW = 4
const TOP_MARGIN = 34
const STAVE_HEIGHT_AREA = 150 // room below the label for the staff + ledger lines
const ROW_GAP = 22
const ROW_HEIGHT = TOP_MARGIN + STAVE_HEIGHT_AREA
const FIRST_MEASURE_WIDTH = 170 // needs room for clef + time signature
const OTHER_MEASURE_WIDTH = 110
const LEFT_MARGIN = 10
const RIGHT_MARGIN = 10

// Laid out in rows of four measures - conveniently, every four measures
// lands on a natural musical boundary (the halfway/turnaround point for
// an 8-measure pattern, or one full A+B cycle for the 16-measure
// lower+upper pattern). Wrapping to multiple rows like this also keeps
// each row short enough to stay legible once scaled down to fit a phone
// screen, rather than needing the whole thing to shrink to fit one very
// wide line.
//
// `markTurnaround`: when true (the default, used by the Pattern and
// Lower/Upper tabs), a double barline marks the halfway point where a
// forward sequence turns into its retrograde. The Custom Generator tab
// has no such structure - its sequence is whatever was typed in, with
// no guaranteed midpoint - so it passes false to skip that marking.
const TetrachordPatternStaff = forwardRef(function TetrachordPatternStaff(
  { measures, markTurnaround = true },
  ref
) {
  const containerRef = useRef(null)
  const notesFlatRef = useRef([])
  const activeElRef = useRef(null)

  useImperativeHandle(ref, () => ({
    highlightNote(index) {
      const note = notesFlatRef.current[index]
      const el = note && note.getSVGElement && note.getSVGElement()
      if (activeElRef.current && activeElRef.current !== el) {
        activeElRef.current.classList.remove('note-active')
      }
      if (el) {
        el.classList.add('note-active')
        activeElRef.current = el
      }
    },
    clearHighlights() {
      if (activeElRef.current) activeElRef.current.classList.remove('note-active')
      activeElRef.current = null
    },
  }))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const rowWidth = LEFT_MARGIN + FIRST_MEASURE_WIDTH + (MEASURES_PER_ROW - 1) * OTHER_MEASURE_WIDTH + RIGHT_MARGIN
    const rowCount = Math.ceil(measures.length / MEASURES_PER_ROW)
    const totalHeight = rowCount * ROW_HEIGHT + (rowCount - 1) * ROW_GAP

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(rowWidth, totalHeight)
    const context = renderer.getContext()

    const labelPositions = []
    const notesFlat = []
    const turnaroundIndex = markTurnaround ? measures.length / 2 - 1 : -1

    measures.forEach((measure, i) => {
      const row = Math.floor(i / MEASURES_PER_ROW)
      const col = i % MEASURES_PER_ROW
      const width = col === 0 ? FIRST_MEASURE_WIDTH : OTHER_MEASURE_WIDTH
      const x =
        LEFT_MARGIN +
        (col === 0 ? 0 : FIRST_MEASURE_WIDTH + (col - 1) * OTHER_MEASURE_WIDTH)
      const y = row * (ROW_HEIGHT + ROW_GAP) + TOP_MARGIN

      const stave = new Stave(x, y, width)

      // Every row restates the clef and time signature, same as any new
      // line of real sheet music.
      if (col === 0) {
        stave.addClef('treble')
        stave.addTimeSignature('4/4')
      } else {
        stave.setBegBarType(BarlineType.NONE)
      }

      if (i === turnaroundIndex) {
        stave.setEndBarType(BarlineType.DOUBLE)
      } else if (i === measures.length - 1) {
        stave.setEndBarType(BarlineType.END)
      }

      stave.setContext(context).draw()

      const staveNotes = measure.notes.map((note) => {
        const { vexKey, accidental } = toVexKey(note)
        const staveNote = new StaveNote({ keys: [vexKey], duration: 'q' })
        if (accidental) {
          staveNote.addModifier(new Accidental(accidental), 0)
        }
        return staveNote
      })
      notesFlat.push(...staveNotes)

      const voice = new Voice({ num_beats: 4, beat_value: 4 })
      voice.addTickables(staveNotes)

      const formatWidth = stave.getNoteEndX() - stave.getNoteStartX() - 8
      new Formatter().joinVoices([voice]).format([voice], formatWidth)
      voice.draw(context, stave)

      labelPositions.push({
        label: measure.label,
        x: (stave.getNoteStartX() + stave.getNoteEndX()) / 2,
        y: y - 12,
      })
    })

    notesFlatRef.current = notesFlat
    activeElRef.current = null

    const svg = el.querySelector('svg')
    if (svg) {
      labelPositions.forEach(({ label, x: labelX, y: labelY }) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.textContent = label
        text.setAttribute('x', String(labelX))
        text.setAttribute('y', String(labelY))
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('font-family', 'Fredoka, sans-serif')
        text.setAttribute('font-weight', '600')
        text.setAttribute('font-size', '15')
        // Upper-tetrachord (B) labels get a different color than lower
        // (A) ones, so an alternating A/B pattern is easy to track at a
        // glance - this has no effect on the plain A-only pattern tab,
        // since every label there starts with "A".
        text.setAttribute('fill', label.startsWith('B') ? 'var(--teal)' : 'var(--violet)')
        svg.appendChild(text)
      })

      svg.setAttribute('viewBox', `0 0 ${rowWidth} ${totalHeight}`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.style.width = '100%'
      svg.style.maxWidth = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
      el.style.width = '100%'
    }
  }, [measures, markTurnaround])

  return <div className="tetrachord-pattern-staff" ref={containerRef} />
})

export default TetrachordPatternStaff
