import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  Dot,
  BarlineType,
  StaveConnector,
} from 'vexflow'
import { unitsForOption, vexDurationForUnits } from '../data/rhythm.js'

const PARTS = ['sing', 'clap', 'step']
const LABELS = { sing: 'Sing', clap: 'Clap', step: 'Step' }

const SVG_WIDTH = 560
const STAVE_X = 78
const STAVE_WIDTH = SVG_WIDTH - STAVE_X - 14
const ROW_HEIGHT = 88
const TOP_MARGIN = 10
const SVG_HEIGHT = ROW_HEIGHT * 3 + TOP_MARGIN + 20

const RhythmScore = forwardRef(function RhythmScore({ options, colors }, ref) {
  const containerRef = useRef(null)
  const notesByPartRef = useRef({ sing: [], clap: [], step: [] })
  const activeElsRef = useRef({ sing: null, clap: null, step: null })

  useImperativeHandle(ref, () => ({
    // Called by the player the instant a note starts sounding.
    highlightNote(part, index) {
      const notes = notesByPartRef.current[part]
      const note = notes && notes[index]
      const el = note && note.getSVGElement && note.getSVGElement()
      const prev = activeElsRef.current[part]
      if (prev && prev !== el) prev.classList.remove('note-active')
      if (el) {
        el.classList.add('note-active')
        activeElsRef.current[part] = el
      }
    },
    // Called on Stop so nothing is left highlighted.
    clearHighlights() {
      PARTS.forEach((part) => {
        const el = activeElsRef.current[part]
        if (el) el.classList.remove('note-active')
        activeElsRef.current[part] = null
      })
    },
  }))

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = ''

    const renderer = new Renderer(el, Renderer.Backends.SVG)
    renderer.resize(SVG_WIDTH, SVG_HEIGHT)
    const context = renderer.getContext()

    const staves = {}
    const voices = {}
    const notesByPart = {}

    PARTS.forEach((part, rowIndex) => {
      const y = TOP_MARGIN + rowIndex * ROW_HEIGHT
      const stave = new Stave(STAVE_X, y, STAVE_WIDTH)
      stave.setBegBarType(BarlineType.REPEAT_BEGIN)
      stave.setEndBarType(BarlineType.REPEAT_END)
      stave.addTimeSignature('12/8')
      stave.setContext(context).draw()
      staves[part] = stave

      const units = unitsForOption(options[part])
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
      notesByPart[part] = notes

      const voice = new Voice({ num_beats: 12, beat_value: 8 })
      voice.addTickables(notes)
      voices[part] = voice
    })

    // Each voice is formatted independently, on purpose: VexFlow's joint
    // multi-voice formatting groups tickables purely by raw tick
    // position, with no notion that they're on separate staves. Since
    // this rhythm's parts often land on the exact same tick as each
    // other, joint formatting was treating those as colliding notes on
    // one shared staff and nudging one aside to avoid an overlap that
    // doesn't actually exist between separate staves. All three staves
    // share the same width and starting x, which is what keeps their
    // note timelines aligned - they just don't need to be reasoned about
    // together to get there.
    PARTS.forEach((part) => {
      const voice = voices[part]
      new Formatter().joinVoices([voice]).format([voice], STAVE_WIDTH - 90)
    })
    PARTS.forEach((part) => voices[part].draw(context, staves[part]))

    new StaveConnector(staves.sing, staves.step)
      .setType('bracket')
      .setContext(context)
      .draw()

    notesByPartRef.current = notesByPart
    activeElsRef.current = { sing: null, clap: null, step: null }

    const svg = el.querySelector('svg')
    if (svg) {
      PARTS.forEach((part) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.textContent = LABELS[part]
        text.setAttribute('x', 6)
        text.setAttribute('y', String(staves[part].getYForLine(2) + 4))
        text.setAttribute('font-family', 'Fredoka, sans-serif')
        text.setAttribute('font-weight', '600')
        text.setAttribute('font-size', '14')
        text.setAttribute('fill', colors[part])
        svg.appendChild(text)
      })

      svg.setAttribute('viewBox', `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`)
      svg.removeAttribute('width')
      svg.removeAttribute('height')
      // VexFlow's own resize() call sets a fixed pixel width as an
      // inline style on both the SVG and its wrapper div - inline styles
      // always beat stylesheet rules, so that silently overrode the
      // width:100% in index.css and kept the score at full size no
      // matter the screen. Clearing it here is what lets the score
      // actually shrink to fit on mobile.
      svg.style.width = '100%'
      svg.style.maxWidth = '100%'
      svg.style.height = 'auto'
      svg.style.display = 'block'
      el.style.width = '100%'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.sing, options.clap, options.step])

  return <div className="rhythm-score-svg" ref={containerRef} />
})

export default RhythmScore
