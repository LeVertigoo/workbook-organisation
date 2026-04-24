import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const WEBHOOK_URL = 'https://n8n.srv1272919.hstgr.cloud/webhook/kalanis-workbook-orga'
const SUPABASE_URL = 'https://qglyfohuebgbuztjqaok.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbHlmb2h1ZWJnYnV6dGpxYW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTgxODQsImV4cCI6MjA5MTgzNDE4NH0.HKqxiTKQDV8zvfpTmE8RlDq_GsbwHATzfn1gyDkJLxQ'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// Calendar constants
const SH = 14          // px per 15-min slot
const DS = 24          // 6h00 = slot 24
const DE = 80          // 20h00 = slot 80
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const PALETTE_COLORS = ['#018EBB','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16']

let _uid = 0
const uid = () => String(++_uid)

const toTime = (slot) => {
  const h = Math.floor(slot / 4), m = (slot % 4) * 15
  return `${String(h).padStart(2,'0')}h${m === 0 ? '' : String(m).padStart(2,'0')}`
}

const HOUR_LABELS = []
for (let s = DS; s <= DE; s += 4) HOUR_LABELS.push(s)

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Parkinsans:wght@400;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Parkinsans', -apple-system, sans-serif; background: #FAF9F2; }

/* Layout */
.wrapper { min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 2.5rem 1rem 3rem; position: relative; background: #FAF9F2; overflow: hidden; }
.blob { position: fixed; border-radius: 50%; background: #018EBB; filter: blur(100px); opacity: .20; pointer-events: none; z-index: 0; }
.blob-1 { width: 480px; height: 480px; top: -140px; left: -150px; }
.blob-2 { width: 350px; height: 350px; top: 35%; right: -100px; }
.grain { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: .10; z-index: 1; }

/* Card (questionnaire screens) */
.qouter { position: relative; z-index: 2; width: 100%; max-width: 620px; border-radius: 24px; border: 10px solid rgba(18,28,40,.08); background: #FAF9F2; }
.qcard { background: #FAF9F2; border-radius: 16px; padding: 2.5rem 2rem; }
.prog-bar { height: 4px; background: rgba(18,28,40,.08); border-radius: 2px; margin-bottom: 2rem; overflow: hidden; }
.prog-fill { height: 100%; background: #018EBB; border-radius: 2px; transition: width .4s ease; }

/* Typography */
.badge { display: inline-block; background: #018EBB; color: #fff; border-radius: 20px; padding: 4px 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: .08em; margin-bottom: 1rem; }
h1, h2 { font-size: 1.5rem; font-weight: 800; color: #121C28; line-height: 1.2; margin-bottom: .5rem; }
.sub { font-size: .9rem; color: #4a5568; line-height: 1.55; margin-bottom: 1.5rem; }
.lbl { display: block; font-size: .83rem; font-weight: 700; color: #121C28; margin-bottom: .35rem; }
.hint { font-size: .77rem; color: #718096; margin-bottom: .55rem; margin-top: -.2rem; }

/* Inputs */
.inp { width: 100%; background: #fff; border: 1.5px solid rgba(18,28,40,.15); border-radius: 12px; padding: 12px 16px; font-family: inherit; font-size: .87rem; color: #121C28; margin-bottom: .85rem; outline: none; transition: border-color .2s; }
.inp:focus { border-color: #018EBB; }
.inp::placeholder { color: #a0aec0; }
.inp-area { width: 100%; background: #fff; border: 1.5px solid rgba(18,28,40,.15); border-radius: 12px; padding: 12px 16px; font-family: inherit; font-size: .85rem; color: #121C28; outline: none; transition: border-color .2s; resize: vertical; min-height: 80px; line-height: 1.5; margin-bottom: .85rem; }
.inp-area:focus { border-color: #018EBB; }
.inp-area::placeholder { color: #a0aec0; }

/* Choices */
.choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin-bottom: 1.5rem; }
.choice-card { background: #fff; border: 2px solid rgba(18,28,40,.12); border-radius: 14px; padding: 1.1rem 1rem; cursor: pointer; transition: all .18s; text-align: left; font-family: inherit; }
.choice-card:hover { border-color: #018EBB; background: rgba(1,142,187,.04); }
.choice-card.sel { border-color: #018EBB; background: rgba(1,142,187,.08); }
.choice-title { font-size: .9rem; font-weight: 800; color: #121C28; margin-bottom: 3px; }
.choice-desc { font-size: .76rem; color: #718096; line-height: 1.4; }
.choice-3 { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1.5rem; }
.choice-row { background: #fff; border: 1.5px solid rgba(18,28,40,.12); border-radius: 12px; padding: 12px 16px; cursor: pointer; transition: all .18s; font-family: inherit; text-align: left; font-size: .87rem; color: #121C28; font-weight: 600; }
.choice-row:hover { border-color: #018EBB; background: rgba(1,142,187,.04); }
.choice-row.sel { border-color: #018EBB; background: rgba(1,142,187,.08); color: #018EBB; }

/* Tag input */
.tag-section { margin-bottom: 1.25rem; }
.tag-section-lbl { font-size: .8rem; font-weight: 800; color: #121C28; margin-bottom: .3rem; display: flex; align-items: center; gap: 6px; }
.tag-section-emoji { font-size: 1rem; }
.tag-row { display: flex; gap: .5rem; margin-bottom: .5rem; }
.tag-inp { flex: 1; background: #fff; border: 1.5px solid rgba(18,28,40,.12); border-radius: 10px; padding: 9px 14px; font-family: inherit; font-size: .84rem; color: #121C28; outline: none; transition: border-color .2s; }
.tag-inp:focus { border-color: #018EBB; }
.tag-inp::placeholder { color: #a0aec0; }
.tag-add-btn { background: #018EBB; color: #fff; border: none; border-radius: 10px; padding: 9px 14px; font-family: inherit; font-size: .84rem; font-weight: 700; cursor: pointer; transition: opacity .2s; white-space: nowrap; }
.tag-add-btn:hover { opacity: .88; }
.tags-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 10px; }
.tag-chip { display: flex; align-items: center; gap: 5px; background: rgba(1,142,187,.10); color: #018EBB; border-radius: 20px; padding: 4px 10px 4px 12px; font-size: .78rem; font-weight: 700; }
.tag-rm { background: none; border: none; cursor: pointer; color: #018EBB; font-size: .85rem; line-height: 1; padding: 0; opacity: .6; }
.tag-rm:hover { opacity: 1; }

/* Buttons */
.btn-p { width: 100%; background: #121C28; color: #fff; border: none; border-radius: 12px; padding: 14px; font-family: inherit; font-size: .92rem; font-weight: 700; cursor: pointer; transition: opacity .2s; }
.btn-p:hover { opacity: .88; }
.btn-p:disabled { opacity: .35; cursor: not-allowed; }
.btn-b { flex: 1; background: #018EBB; color: #fff; border: none; border-radius: 12px; padding: 12px 20px; font-family: inherit; font-size: .87rem; font-weight: 700; cursor: pointer; transition: opacity .2s; }
.btn-b:hover { opacity: .88; }
.btn-g { flex: 1; background: transparent; color: #718096; border: 1.5px solid rgba(18,28,40,.12); border-radius: 12px; padding: 12px 20px; font-family: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; transition: all .18s; }
.btn-g:hover { border-color: #018EBB; color: #018EBB; }
.btn-row { display: flex; gap: .7rem; margin-top: 1rem; }
.btn-dl { width: 100%; background: transparent; color: #018EBB; border: 1.5px solid #018EBB; border-radius: 12px; padding: 13px; font-family: inherit; font-size: .88rem; font-weight: 700; cursor: pointer; transition: all .2s; margin-top: .6rem; }
.btn-dl:hover { background: rgba(1,142,187,.07); }
.divider { height: 1px; background: rgba(18,28,40,.08); margin: 1.25rem 0; }

/* Deep questions */
.q-block { margin-bottom: 1.2rem; }
.q-num { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #018EBB; color: #fff; border-radius: 50%; font-size: .7rem; font-weight: 800; margin-right: 8px; flex-shrink: 0; }
.q-title { font-size: .87rem; font-weight: 700; color: #121C28; margin-bottom: .3rem; display: flex; align-items: flex-start; gap: 0; }
.q-hint-txt { font-size: .77rem; color: #718096; margin-bottom: .45rem; padding-left: 30px; font-style: italic; }

/* Calendar screen */
.cal-page { position: relative; z-index: 2; width: 100%; max-width: 1100px; }
.cal-header-bar { background: #FAF9F2; border-radius: 16px 16px 0 0; padding: 1.5rem 1.5rem 1rem; border: 10px solid rgba(18,28,40,.08); border-bottom: none; }
.cal-body-wrap { border: 10px solid rgba(18,28,40,.08); border-top: none; border-radius: 0 0 16px 16px; background: #FAF9F2; padding: 0 1rem 1.5rem; }
.cal-layout { display: flex; gap: 1rem; align-items: flex-start; }

/* Palette */
.palette { width: 176px; flex-shrink: 0; background: #fff; border: 1.5px solid rgba(18,28,40,.10); border-radius: 14px; padding: .85rem; }
.palette-title { font-size: .7rem; font-weight: 800; color: #018EBB; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .75rem; }
.palette-chips { display: flex; flex-direction: column; gap: .4rem; margin-bottom: .75rem; }
.p-chip { display: flex; align-items: center; gap: 6px; border-radius: 9px; padding: 7px 10px; font-size: .78rem; font-weight: 700; color: #fff; cursor: grab; user-select: none; transition: opacity .15s, transform .15s; border: none; text-align: left; font-family: inherit; width: 100%; }
.p-chip:active { cursor: grabbing; opacity: .85; transform: scale(.97); }
.p-chip-dot { width: 7px; height: 7px; background: rgba(255,255,255,.5); border-radius: 50%; flex-shrink: 0; }
.p-chip-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.palette-add { width: 100%; background: none; border: 1.5px dashed rgba(18,28,40,.15); border-radius: 9px; padding: 8px; font-family: inherit; font-size: .77rem; font-weight: 700; color: #a0aec0; cursor: pointer; transition: all .18s; }
.palette-add:hover { border-color: #018EBB; color: #018EBB; background: rgba(1,142,187,.04); }
.palette-new-form { display: flex; flex-direction: column; gap: .4rem; }
.palette-new-inp { background: #FAF9F2; border: 1.5px solid rgba(18,28,40,.12); border-radius: 8px; padding: 7px 10px; font-family: inherit; font-size: .8rem; color: #121C28; outline: none; width: 100%; }
.palette-new-inp:focus { border-color: #018EBB; }
.palette-new-btn { background: #018EBB; color: #fff; border: none; border-radius: 8px; padding: 7px; font-family: inherit; font-size: .78rem; font-weight: 700; cursor: pointer; width: 100%; }
.palette-hint { font-size: .68rem; color: #a0aec0; line-height: 1.4; margin-top: .5rem; text-align: center; }

/* Calendar grid */
.cal-outer { flex: 1; overflow-x: auto; min-width: 0; }
.cal-sticky-header { display: flex; padding-left: 44px; margin-bottom: 2px; }
.cal-day-hdr { flex: 1; text-align: center; font-size: .77rem; font-weight: 800; color: #121C28; padding: 6px 0; }
.cal-scroll { overflow-y: auto; max-height: 560px; border-radius: 10px; border: 1.5px solid rgba(18,28,40,.08); }
.cal-inner { display: flex; }
.time-col { width: 44px; flex-shrink: 0; position: sticky; left: 0; background: #FAF9F2; z-index: 3; }
.time-lbl { height: 56px; display: flex; align-items: flex-start; justify-content: flex-end; padding-right: 8px; padding-top: 2px; font-size: .67rem; font-weight: 700; color: #a0aec0; line-height: 1; }
.days-row { display: flex; flex: 1; }
.day-col { flex: 1; min-width: 80px; position: relative; border-left: 1px solid rgba(18,28,40,.06); }
.grid-line { position: absolute; left: 0; right: 0; pointer-events: none; }
.grid-line-hour { border-top: 1px solid rgba(18,28,40,.10); }
.grid-line-half { border-top: 1px dashed rgba(18,28,40,.05); }
.day-drop-zone { position: absolute; top: 0; left: 0; right: 0; bottom: 0; }

/* Calendar blocks */
.cal-block { position: absolute; left: 2px; right: 2px; border-radius: 6px; overflow: hidden; cursor: grab; user-select: none; z-index: 2; display: flex; flex-direction: column; }
.cal-block:active { cursor: grabbing; }
.cal-block-inner { flex: 1; padding: 3px 6px; overflow: hidden; }
.cal-block-label { font-size: .68rem; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
.cal-block-time { font-size: .58rem; color: rgba(255,255,255,.75); line-height: 1.2; }
.cal-block-rm { position: absolute; top: 2px; right: 3px; background: rgba(0,0,0,.2); border: none; border-radius: 3px; color: #fff; font-size: .65rem; cursor: pointer; padding: 0 3px; line-height: 1.4; opacity: 0; transition: opacity .15s; font-family: inherit; }
.cal-block:hover .cal-block-rm { opacity: 1; }
.cal-block-resize { height: 6px; background: rgba(0,0,0,.15); cursor: ns-resize; border-radius: 0 0 6px 6px; flex-shrink: 0; }
.cal-block-resize:hover { background: rgba(0,0,0,.3); }

/* Result */
.ok-banner { background: rgba(34,197,94,.08); border: 1.5px solid rgba(34,197,94,.25); border-radius: 12px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 1rem; font-size: .83rem; color: #15803d; font-weight: 600; line-height: 1.45; }
.err-banner { background: rgba(239,68,68,.06); border: 1.5px solid rgba(239,68,68,.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; margin-bottom: 1rem; font-size: .82rem; color: #b91c1c; font-weight: 600; }
.res-block { background: #fff; border: 1.5px solid rgba(18,28,40,.10); border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: .85rem; }
.res-block-hl { background: rgba(1,142,187,.06); border: 1.5px solid rgba(1,142,187,.15); border-radius: 14px; padding: 1.1rem 1.25rem; margin-bottom: .85rem; }
.res-label { font-size: .7rem; font-weight: 700; color: #018EBB; text-transform: uppercase; letter-spacing: .06em; margin-bottom: .5rem; }
.res-title { font-size: .94rem; font-weight: 800; color: #121C28; margin-bottom: .35rem; }
.res-body { font-size: .82rem; color: #4a5568; line-height: 1.55; }
.fn { font-size: .73rem; color: #a0aec0; text-align: center; margin-top: .75rem; }
`

function Grain() {
  return (
    <svg className="grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#gr)"/>
    </svg>
  )
}

// ─── Tag Input Section ────────────────────────────────────────────────────────
function TagSection({ emoji, label, category, tags, input, onInput, onAdd, onRemove }) {
  return (
    <div className="tag-section">
      <div className="tag-section-lbl"><span className="tag-section-emoji">{emoji}</span>{label}</div>
      <div className="tag-row">
        <input
          className="tag-inp"
          placeholder="Tape une habitude et appuie sur Entrée"
          value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(input) } }}
        />
        <button className="tag-add-btn" onClick={() => onAdd(input)}>+ Ajouter</button>
      </div>
      <div className="tags-list">
        {tags.map(t => (
          <div key={t} className="tag-chip">
            {t}
            <button className="tag-rm" onClick={() => onRemove(t)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Calendar Block ───────────────────────────────────────────────────────────
function CalBlock({ block, onDragStart, onRemove, onResizeStart }) {
  const topPx = (block.startSlot - DS) * SH
  const heightPx = block.duration * SH
  const showLabel = heightPx >= 22
  const showTime = heightPx >= 36

  return (
    <div
      className="cal-block"
      style={{ top: topPx, height: heightPx, background: block.color }}
      draggable
      onDragStart={e => onDragStart(e, block)}
    >
      <button className="cal-block-rm" onClick={e => { e.stopPropagation(); onRemove(block.id) }}>×</button>
      <div className="cal-block-inner">
        {showLabel && <div className="cal-block-label">{block.label}</div>}
        {showTime && <div className="cal-block-time">{toTime(block.startSlot)}</div>}
      </div>
      <div
        className="cal-block-resize"
        onMouseDown={e => onResizeStart(e, block)}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkbookOrga() {
  const [screen, setScreen] = useState('home')

  // Phase 1
  const [name, setName] = useState('')
  const [workStyle, setWorkStyle] = useState('')
  const [largeBlocks, setLargeBlocks] = useState('')

  // Phase 2 — deep questions
  const [deepQ, setDeepQ] = useState({ q1: '', q2: '', q3: '' })

  // Phase 3 — habits
  const [habitInputs, setHabitInputs] = useState({ matin: '', journee: '', soir: '', weekend: '' })
  const [habitTags, setHabitTags] = useState({ matin: [], journee: [], soir: [], weekend: [] })

  // Phase 4 — calendar
  const [habits, setHabits] = useState([])
  const [blocks, setBlocks] = useState([])
  const [newHabitVal, setNewHabitVal] = useState('')
  const [showNewHabit, setShowNewHabit] = useState(false)

  // Drag / resize refs
  const dragPayload = useRef(null)
  const resizeState = useRef(null)

  // Result
  const [resultHtml, setResultHtml] = useState('')
  const [slackOk, setSlackOk] = useState(false)
  const [slackErr, setSlackErr] = useState('')

  const go = (s) => { setScreen(s); window.scrollTo(0, 0) }

  // View mode (?view=uuid)
  useState(() => {
    const params = new URLSearchParams(window.location.search)
    const viewId = params.get('view')
    if (!viewId) return
    supabase.from('workbook_organisation').select('nom, result_html').eq('id', viewId).single()
      .then(({ data }) => {
        if (data) { setName(data.nom); setResultHtml(data.result_html); setScreen('result') }
      })
  })

  // Sync habits palette from tags
  useEffect(() => {
    const allTags = [...habitTags.matin, ...habitTags.journee, ...habitTags.soir, ...habitTags.weekend]
    const unique = [...new Set(allTags)]
    setHabits(prev => {
      const existingMap = new Map(prev.map(h => [h.label.toLowerCase(), h]))
      return unique.map((label, i) => existingMap.get(label.toLowerCase()) || {
        id: uid(), label, color: PALETTE_COLORS[i % PALETTE_COLORS.length]
      })
    })
  }, [habitTags])

  // Tag helpers
  const addTag = (cat, val) => {
    const v = val.trim()
    if (!v) return
    setHabitTags(prev => ({ ...prev, [cat]: prev[cat].includes(v) ? prev[cat] : [...prev[cat], v] }))
    setHabitInputs(prev => ({ ...prev, [cat]: '' }))
  }
  const removeTag = (cat, tag) => setHabitTags(prev => ({ ...prev, [cat]: prev[cat].filter(t => t !== tag) }))

  // ── Calendar interactions ──────────────────────────────────────────────────

  // Drag from palette
  const onPaletteDragStart = (e, habit) => {
    dragPayload.current = { type: 'new', habit }
    e.dataTransfer.effectAllowed = 'copy'
  }

  // Drag existing block
  const onBlockDragStart = (e, block) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetSlots = Math.floor((e.clientY - rect.top) / SH)
    dragPayload.current = { type: 'move', block, offsetSlots }
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }

  // Drop on day column
  const onDayDrop = (e, dayIdx) => {
    e.preventDefault()
    const p = dragPayload.current
    if (!p) return
    const rect = e.currentTarget.getBoundingClientRect()
    const slotOffset = Math.floor((e.clientY - rect.top) / SH)
    const slot = DS + slotOffset

    if (p.type === 'new') {
      setBlocks(prev => [...prev, {
        id: uid(), day: dayIdx,
        startSlot: Math.max(DS, Math.min(DE - 4, slot)),
        duration: 4,
        label: p.habit.label,
        color: p.habit.color
      }])
    } else if (p.type === 'move') {
      const newStart = Math.max(DS, Math.min(DE - p.block.duration, slot - p.offsetSlots))
      setBlocks(prev => prev.map(b => b.id === p.block.id ? { ...b, day: dayIdx, startSlot: newStart } : b))
    }
    dragPayload.current = null
  }

  // Remove block
  const removeBlock = (blockId) => setBlocks(prev => prev.filter(b => b.id !== blockId))

  // Resize
  const onResizeStart = (e, block) => {
    e.preventDefault()
    e.stopPropagation()
    resizeState.current = { blockId: block.id, startY: e.clientY, startDuration: block.duration, maxDuration: DE - block.startSlot }
  }

  useEffect(() => {
    const onMove = (e) => {
      const rs = resizeState.current
      if (!rs) return
      const delta = e.clientY - rs.startY
      const newDur = Math.max(1, Math.min(rs.maxDuration, rs.startDuration + Math.round(delta / SH)))
      setBlocks(prev => prev.map(b => b.id === rs.blockId ? { ...b, duration: newDur } : b))
    }
    const onUp = () => { resizeState.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  // Add new habit from palette form
  const addNewHabit = () => {
    const v = newHabitVal.trim()
    if (!v) return
    if (!habits.find(h => h.label.toLowerCase() === v.toLowerCase())) {
      setHabits(prev => [...prev, { id: uid(), label: v, color: PALETTE_COLORS[prev.length % PALETTE_COLORS.length] }])
    }
    setNewHabitVal('')
    setShowNewHabit(false)
  }

  // ── Analysis ───────────────────────────────────────────────────────────────
  const analyzeCalendar = () => {
    const dayResults = DAYS.map((_, di) => {
      const occupied = new Set()
      blocks.filter(b => b.day === di).forEach(b => {
        for (let s = b.startSlot; s < b.startSlot + b.duration; s++) occupied.add(s)
      })
      const free = []
      for (let s = DS; s < DE; s++) if (!occupied.has(s)) free.push(s)

      // Find contiguous blocks
      const contiguous = []
      let cur = null
      free.forEach(s => {
        if (!cur) { cur = { start: s, len: 1 }; return }
        if (s === cur.start + cur.len) { cur.len++; return }
        contiguous.push(cur); cur = { start: s, len: 1 }
      })
      if (cur) contiguous.push(cur)

      const maxBlock = contiguous.length ? contiguous.reduce((m, c) => c.len > m.len ? c : m) : { start: DS, len: 0 }
      return { di, free, contiguous, maxBlock }
    })

    const daysWithLarge = dayResults.filter(r => r.maxBlock.len >= 8) // 2h+
    const bestDay = dayResults.reduce((best, r) => r.maxBlock.len > best.maxBlock.len ? r : best)
    const canBatch = daysWithLarge.length >= 1
    const preferBatching = workStyle === 'batching'
    const declaredLarge = largeBlocks === 'often'

    let verdict, explanation, advice
    if (preferBatching && canBatch) {
      verdict = '✅ Batching validé'
      explanation = `Tu as ${daysWithLarge.length} jour(s) avec des créneaux libres de 2h+ — le batching correspond à ton organisation actuelle.`
      advice = "Tu peux réserver un grand bloc hebdomadaire pour produire tout ton contenu d'un coup."
    } else if (preferBatching && !canBatch) {
      verdict = '⚠️ Batching difficile à tenir'
      explanation = `Tu préfères le batching, mais ton planning actuel ne libère pas de créneaux de 2h+. Deux options : libérer un grand bloc (on verra ça ensemble), ou adopter les micro-sessions d'ici là.`
      advice = "Pour l'instant, des sessions de 30 min × 3 fois/semaine seront plus réalistes."
    } else if (!preferBatching && canBatch) {
      verdict = '💡 Micro-sessions OK, batching possible'
      explanation = `Tu préfères les micro-sessions, mais tu as des créneaux de 2h+ disponibles. Le batching pourrait te faire gagner en fluidité créative — à tester.`
      advice = "Si les micro-sessions fonctionnent bien pour toi, garde-les. Sinon, on a les ressources pour passer au batching."
    } else {
      verdict = '✅ Micro-sessions validées'
      explanation = `Tes journées sont bien remplies sans grands créneaux disponibles — les micro-sessions de 20-30 min sont la bonne approche.`
      advice = "Identifie 3 micro-slots dans ta semaine et bloque-les comme des réunions."
    }

    const oneBloc = bestDay.maxBlock
    const oneBlocLabel = oneBloc.len > 0
      ? `${DAYS[bestDay.di]} · ${toTime(oneBloc.start)} → ${toTime(oneBloc.start + oneBloc.len)} (${Math.round(oneBloc.len * 15 / 60 * 10) / 10}h)`
      : 'À identifier ensemble'

    return { verdict, explanation, advice, oneBlocLabel, dayResults, canBatch }
  }

  // ── Build result HTML ──────────────────────────────────────────────────────
  const buildResultHtml = () => {
    const a = analyzeCalendar()

    const calGrid = DAYS.map((day, di) => {
      const dayBlocks = blocks.filter(b => b.day === di).sort((a, b) => a.startSlot - b.startSlot)
      const chips = dayBlocks.map(b =>
        `<span style="display:inline-flex;align-items:center;gap:4px;background:${b.color}22;border:1.5px solid ${b.color};border-radius:6px;padding:2px 8px;font-size:.72rem;font-weight:700;color:#121C28;margin:2px">
          <span style="width:6px;height:6px;background:${b.color};border-radius:50%;flex-shrink:0"></span>
          ${toTime(b.startSlot)} · ${b.label} (${b.duration * 15}min)
        </span>`
      ).join('')
      return `<div style="margin-bottom:.65rem">
        <span style="font-size:.77rem;font-weight:800;color:#121C28;display:inline-block;width:30px">${day}</span>
        ${chips || '<span style="font-size:.75rem;color:#a0aec0;font-style:italic">Pas de blocs renseignés</span>'}
      </div>`
    }).join('')

    return `
      <div class="res-block-hl">
        <div class="res-label">Mode déclaré</div>
        <div class="res-title">${workStyle === 'batching' ? '🧱 Batching' : '⚡ Micro-sessions'}</div>
      </div>
      <div class="res-block">
        <div class="res-label">Planning de la semaine</div>
        ${calGrid}
      </div>
      <div class="res-block">
        <div class="res-label">Diagnostic</div>
        <div class="res-title">${a.verdict}</div>
        <div class="res-body" style="margin-bottom:.5rem">${a.explanation}</div>
        <div class="res-body" style="font-style:italic">${a.advice}</div>
      </div>
      <div class="res-block-hl">
        <div class="res-label">Ton ONE bloc</div>
        <div class="res-title">${a.oneBlocLabel}</div>
        <div class="res-body" style="margin-top:.35rem">Le créneau le plus long sans habitudes fixes dans ta semaine — c'est là que tout commence.</div>
      </div>
    `
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const resHtml = buildResultHtml()
    setResultHtml(resHtml)
    go('result')
    setSlackOk(false); setSlackErr('')
    try {
      const { data: row, error } = await supabase
        .from('workbook_organisation')
        .insert({ nom: name, result_html: resHtml, data: { workStyle, largeBlocks, deepQ, habitTags, blocks } })
        .select('id').single()
      if (error) throw error
      const html_url = `${window.location.origin}?view=${row.id}`
      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: name, workStyle, html_url })
      })
      if (resp.ok) setSlackOk(true)
      else setSlackErr(`Erreur ${resp.status}`)
    } catch { setSlackErr("Erreur lors de l'envoi.") }
  }

  const downloadResult = () => {
    const title = `Organisation, ${name}`
    const doc = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>${title} — Kalanis</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,sans-serif;background:#FAF9F2;padding:2rem 1rem}.container{max-width:640px;margin:0 auto}.badge{display:inline-block;background:#018EBB;color:#fff;border-radius:20px;padding:4px 12px;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.08em;margin-bottom:1rem}h1{font-size:1.4rem;font-weight:800;color:#121C28;margin-bottom:.35rem}.meta{font-size:.8rem;color:#718096;margin-bottom:1.5rem}.res-block{background:#fff;border:1.5px solid rgba(18,28,40,.10);border-radius:14px;padding:1rem 1.25rem;margin-bottom:.85rem}.res-block-hl{background:rgba(1,142,187,.06);border:1.5px solid rgba(1,142,187,.15);border-radius:14px;padding:1rem 1.25rem;margin-bottom:.85rem}.res-label{font-size:.7rem;font-weight:700;color:#018EBB;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem}.res-title{font-size:.94rem;font-weight:800;color:#121C28;margin-bottom:.35rem}.res-body{font-size:.82rem;color:#4a5568;line-height:1.55}footer{text-align:center;font-size:.72rem;color:#a0aec0;margin-top:2rem;padding-top:1rem;border-top:1px solid rgba(18,28,40,.07)}</style>
</head><body><div class="container">
<div class="badge">Kalanis • Organisation & Habitudes</div>
<h1>${title}</h1>
<p class="meta">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
${resultHtml || buildResultHtml()}
<footer>Kalanis — Document confidentiel</footer>
</div></body></html>`
    const blob = new Blob([doc], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Kalanis_Orga_${name.replace(/\s+/g, '_')}.html`
    a.click(); URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    setScreen('home'); setName(''); setWorkStyle(''); setLargeBlocks('')
    setDeepQ({ q1: '', q2: '', q3: '' })
    setHabitInputs({ matin: '', journee: '', soir: '', weekend: '' })
    setHabitTags({ matin: [], journee: [], soir: [], weekend: [] })
    setHabits([]); setBlocks([])
    setSlackOk(false); setSlackErr(''); setResultHtml('')
  }

  const totalTags = Object.values(habitTags).flat().length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="wrapper">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <Grain />

        {/* ── HOME ── */}
        {screen === 'home' && (
          <div className="qouter">
            <div className="qcard">
              <div className="badge">Kalanis • Organisation</div>
              <h1>Construis ta routine de création</h1>
              <p className="sub">Avant de décider quand et comment produire ton contenu LinkedIn, on va cartographier ta semaine réelle — pas idéale. 15 minutes pour avoir de la clarté.</p>
              <div className="divider" />
              <span className="lbl">Ton prénom et nom *</span>
              <input className="inp" placeholder="ex : Marie Dupont" value={name} onChange={e => setName(e.target.value)} />

              <span className="lbl" style={{ marginBottom: '.6rem', display: 'block' }}>Comment tu imagines produire ton contenu ? *</span>
              <div className="choice-grid" style={{ marginBottom: '1.25rem' }}>
                <button className={`choice-card${workStyle === 'batching' ? ' sel' : ''}`} onClick={() => setWorkStyle('batching')}>
                  <div className="choice-title">🧱 Batching</div>
                  <div className="choice-desc">1 grand bloc par semaine pour tout produire d'un coup</div>
                </button>
                <button className={`choice-card${workStyle === 'micro' ? ' sel' : ''}`} onClick={() => setWorkStyle('micro')}>
                  <div className="choice-title">⚡ Micro-sessions</div>
                  <div className="choice-desc">Plusieurs sessions courtes de 20-30 min dans la semaine</div>
                </button>
              </div>

              <span className="lbl">Dans ta semaine actuelle, as-tu des créneaux de 2h+ sans interruption ? *</span>
              <div className="choice-3">
                {[['often', 'Oui, souvent'], ['sometimes', 'Parfois, mais c'est rare'], ['rarely', 'Rarement ou jamais']].map(([v, l]) => (
                  <button key={v} className={`choice-row${largeBlocks === v ? ' sel' : ''}`} onClick={() => setLargeBlocks(v)}>{l}</button>
                ))}
              </div>

              <button className="btn-p" disabled={!name.trim() || !workStyle || !largeBlocks} onClick={() => go('deep')}>Commencer →</button>
            </div>
          </div>
        )}

        {/* ── DEEP QUESTIONS ── */}
        {screen === 'deep' && (
          <div className="qouter">
            <div className="qcard">
              <div className="prog-bar"><div className="prog-fill" style={{ width: '25%' }} /></div>
              <div className="badge">Comprendre comment tu fonctionnes</div>
              <h2>Avant de planifier, on creuse un peu</h2>
              <p className="sub">Pas de bonne ou mauvaise réponse — ces questions existent pour révéler tes patterns réels, pas tes intentions.</p>

              <div className="q-block">
                <div className="q-title"><span className="q-num">1</span></div>
                <div className="lbl" style={{ paddingLeft: 30 }}>Pense à une semaine où tu as été vraiment productif. À quoi ressemblaient tes matins ?</div>
                <p className="q-hint-txt">Heure de réveil, routine, énergie… Ce qui rendait cette semaine différente des autres.</p>
                <textarea className="inp-area" placeholder="ex : Je me levais à 6h30, je faisais 30 min de sport avant de commencer, pas de téléphone avant 9h..." value={deepQ.q1} onChange={e => setDeepQ(p => ({ ...p, q1: e.target.value }))} />
              </div>

              <div className="q-block">
                <div className="q-title"><span className="q-num">2</span></div>
                <div className="lbl" style={{ paddingLeft: 30 }}>Qu'est-ce qui sabote le plus souvent tes meilleures intentions de travail ?</div>
                <p className="q-hint-txt">Interruptions, notifications, réunions imprévues, manque d'énergie à certaines heures…</p>
                <textarea className="inp-area" placeholder="ex : Les messages Slack en continu, les appels imprévus l'après-midi, la fatigue après déjeuner..." value={deepQ.q2} onChange={e => setDeepQ(p => ({ ...p, q2: e.target.value }))} />
              </div>

              <div className="q-block">
                <div className="q-title"><span className="q-num">3</span></div>
                <div className="lbl" style={{ paddingLeft: 30 }}>Quelle est l'habitude qui, si tu la faisais sans exception chaque semaine, changerait ta façon de produire ?</div>
                <p className="q-hint-txt">La "one thing" de ta routine content — celle qui débloque tout le reste.</p>
                <textarea className="inp-area" placeholder="ex : Écrire 20 min chaque matin avant d'ouvrir mes emails, ou bloquer le vendredi matin pour le contenu..." value={deepQ.q3} onChange={e => setDeepQ(p => ({ ...p, q3: e.target.value }))} />
              </div>

              <div className="btn-row">
                <button className="btn-g" onClick={() => go('home')}>← Retour</button>
                <button className="btn-b" onClick={() => go('habits')}>Continuer →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── HABITS ── */}
        {screen === 'habits' && (
          <div className="qouter">
            <div className="qcard">
              <div className="prog-bar"><div className="prog-fill" style={{ width: '50%' }} /></div>
              <div className="badge">Tes habitudes actuelles</div>
              <h2>Cartographie ta semaine réelle</h2>
              <p className="sub">Liste tout ce que tu fais déjà de façon régulière — sport, repas en famille, réunions fixes, lecture, méditation… Même les choses non-business. Ce sont ces blocs qu'on va placer dans le calendrier.</p>

              <TagSection emoji="🌅" label="Matin (avant 9h)" category="matin"
                tags={habitTags.matin} input={habitInputs.matin}
                onInput={v => setHabitInputs(p => ({ ...p, matin: v }))}
                onAdd={v => addTag('matin', v)} onRemove={t => removeTag('matin', t)} />

              <TagSection emoji="💼" label="Journée de travail" category="journee"
                tags={habitTags.journee} input={habitInputs.journee}
                onInput={v => setHabitInputs(p => ({ ...p, journee: v }))}
                onAdd={v => addTag('journee', v)} onRemove={t => removeTag('journee', t)} />

              <TagSection emoji="🌆" label="Soir (après 18h)" category="soir"
                tags={habitTags.soir} input={habitInputs.soir}
                onInput={v => setHabitInputs(p => ({ ...p, soir: v }))}
                onAdd={v => addTag('soir', v)} onRemove={t => removeTag('soir', t)} />

              <TagSection emoji="📅" label="Weekend" category="weekend"
                tags={habitTags.weekend} input={habitInputs.weekend}
                onInput={v => setHabitInputs(p => ({ ...p, weekend: v }))}
                onAdd={v => addTag('weekend', v)} onRemove={t => removeTag('weekend', t)} />

              <div className="btn-row">
                <button className="btn-g" onClick={() => go('deep')}>← Retour</button>
                <button className="btn-b" disabled={totalTags < 1} onClick={() => go('calendar')}>Placer dans le calendrier →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {screen === 'calendar' && (
          <div className="cal-page">
            <div className="cal-header-bar">
              <div className="prog-bar" style={{ marginBottom: '.75rem' }}><div className="prog-fill" style={{ width: '75%' }} /></div>
              <div className="badge">Ton planning</div>
              <h2>Place tes habitudes dans ta semaine</h2>
              <p className="sub" style={{ marginBottom: 0 }}>Glisse tes habitudes depuis la palette et dépose-les sur le bon créneau. Redimensionne les blocs par le bas. Double-clic pour supprimer.</p>
            </div>
            <div className="cal-body-wrap">
              <div className="cal-layout">

                {/* Palette */}
                <div className="palette">
                  <div className="palette-title">Tes habitudes</div>
                  <div className="palette-chips">
                    {habits.map(h => (
                      <button
                        key={h.id}
                        className="p-chip"
                        style={{ background: h.color }}
                        draggable
                        onDragStart={e => onPaletteDragStart(e, h)}
                      >
                        <div className="p-chip-dot" />
                        <span className="p-chip-label">{h.label}</span>
                      </button>
                    ))}
                  </div>
                  {!showNewHabit ? (
                    <button className="palette-add" onClick={() => setShowNewHabit(true)}>+ Nouvelle habitude</button>
                  ) : (
                    <div className="palette-new-form">
                      <input
                        className="palette-new-inp"
                        autoFocus
                        placeholder="Nom de l'habitude"
                        value={newHabitVal}
                        onChange={e => setNewHabitVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addNewHabit(); if (e.key === 'Escape') setShowNewHabit(false) }}
                      />
                      <button className="palette-new-btn" onClick={addNewHabit}>Ajouter</button>
                    </div>
                  )}
                  <p className="palette-hint">Glisse · Dépose · Redimensionne</p>
                </div>

                {/* Calendar */}
                <div className="cal-outer">
                  <div className="cal-sticky-header">
                    {DAYS.map(d => <div key={d} className="cal-day-hdr">{d}</div>)}
                  </div>
                  <div className="cal-scroll">
                    <div className="cal-inner">
                      {/* Time column */}
                      <div className="time-col">
                        {HOUR_LABELS.map(s => (
                          <div key={s} className="time-lbl" style={{ height: 56 }}>{Math.floor(s / 4)}h</div>
                        ))}
                      </div>
                      {/* Day columns */}
                      <div className="days-row">
                        {DAYS.map((day, di) => (
                          <div
                            key={di}
                            className="day-col"
                            style={{ height: (DE - DS) * SH }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => onDayDrop(e, di)}
                          >
                            {/* Grid lines */}
                            {HOUR_LABELS.map(s => (
                              <div key={s}>
                                <div className="grid-line grid-line-hour" style={{ top: (s - DS) * SH }} />
                                <div className="grid-line grid-line-half" style={{ top: (s - DS + 2) * SH }} />
                              </div>
                            ))}
                            {/* Blocks */}
                            {blocks.filter(b => b.day === di).map(block => (
                              <CalBlock
                                key={block.id}
                                block={block}
                                onDragStart={onBlockDragStart}
                                onRemove={removeBlock}
                                onResizeStart={onResizeStart}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="btn-row" style={{ marginTop: '1.25rem' }}>
                <button className="btn-g" onClick={() => go('habits')}>← Retour</button>
                <button className="btn-b" onClick={handleSubmit}>Voir mon diagnostic →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {screen === 'result' && (
          <div className="qouter">
            <div className="qcard">
              <div className="prog-bar"><div className="prog-fill" style={{ width: '100%' }} /></div>
              <div className="badge">Diagnostic ✓</div>
              <h2>Ton organisation, {name} 🎯</h2>
              <p className="sub">Voici l'analyse de ta semaine. Le récapitulatif a été envoyé automatiquement — on en parle ensemble.</p>

              {slackOk && (
                <div className="ok-banner">
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✅</span>
                  <span>Récapitulatif envoyé ! Thomas le recevra avant votre call.</span>
                </div>
              )}
              {slackErr && (
                <div className="err-banner">
                  <span>⚠️</span><span>{slackErr}</span>
                </div>
              )}

              <div dangerouslySetInnerHTML={{ __html: resultHtml || buildResultHtml() }} />

              <button className="btn-dl" onClick={downloadResult}>⬇ Télécharger le résumé (HTML)</button>
              <button className="btn-g" onClick={resetAll} style={{ marginTop: '.6rem', width: '100%', display: 'block' }}>Recommencer</button>
              <p className="fn">Thomas analysera ce résumé avec toi pour définir ta routine idéale.</p>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
