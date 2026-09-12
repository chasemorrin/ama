import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow'
import { toVexKey } from '../data/tetrachord.js'

const WIDTH = 460
const HEIGHT = 180

const TetrachordStaff = forwardRef(function TetrachordStaff({ notes }, ref) {
  const containerRef = useRef(null)
  const notesRef = useRef([])
  const activeElRef = useRef(null)

  useImperativeHandle(ref, () => ({
    highlightNote(index) {
      const note = notesRef.current[index]
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

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(WIDTH, HEIGHT)
    const context = renderer.getContext()

    const stave = new Stave(10, 20, WIDTH - 20)
    stave.addClef('treble')
    stave.setContext(context).draw()

    const staveNotes = notes.map((note) => {
      const { vexKey, accidental } = toVexKey(note)
      const staveNote = new StaveNote({ keys: [vexKey], duration: 'q' })
      if (accidental) {
        staveNote.addModifier(new Accidental(accidental), 0)
      }
      return staveNote
    })
    notesRef.current = staveNotes
    activeElRef.current = null

    const voice = new Voice({ num_beats: 4, beat_value: 4 })
    voice.addTickables(staveNotes)

    new Formatter().joinVoices([voice]).format([voice], WIDTH - 100)
    voice.draw(context, stave)

    // A small note-name label under each notehead, so the letter name
    // matches what's selected above without having to read the staff.
    const svg = el.querySelector('svg')
    if (svg) {
      staveNotes.forEach((staveNote, i) => {
        const x = staveNote.getAbsoluteX()
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.textContent = notes[i].name
        text.setAttribute('x', String(x))
        text.setAttribute('y', String(HEIGHT - 14))
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('font-family', 'Fredoka, sans-serif')
        text.setAttribute('font-weight', '600')
        text.setAttribute('font-size', '14')
        text.setAttribute('fill', 'var(--ink-soft)')
        svg.appendChild(text)
      })

      svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      svg.style.width = '100%'
      svg.style.maxWidth = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
      el.style.width = '100%'
    }
  }, [notes])

  return <div className="tetrachord-staff" ref={containerRef} />
})

export default TetrachordStaff
