import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const WEBHOOK_URL = 'https://n8n.srv1272919.hstgr.cloud/webhook/2dbcdad9-f9e9-4f6c-806f-8016b76f6953'
const SUPABASE_URL = 'https://qglyfohuebgbuztjqaok.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbHlmb2h1ZWJnYnV6dGpxYW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTgxODQsImV4cCI6MjA5MTgzNDE4NH0.HKqxiTKQDV8zvfpTmE8RlDq_GsbwHATzfn1gyDkJLxQ'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

const SH = 14
const DS = 24   // 6h
const DE = 80   // 20h
const NOON = 52 // 13h

const ALL_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

let _uid = 0
const uid = () => String(++_uid)

const toTime = slot => {
  const h = Math.floor(slot / 4), m = (slot % 4) * 15
  return `${String(h).padStart(2,'0')}h${m ? String(m).padStart(2,'0') : ''}`
}

const AM_HOURS = [], PM_HOURS = []
for (let s = DS; s < NOON; s += 4) AM_HOURS.push(s)
for (let s = NOON; s <= DE; s += 4) PM_HOURS.push(s)

const BTYPE = {
  engagement: { color: '#018EBB', bg: 'rgba(1,142,187,.12)', label: 'Engagement', icon: '💬' },
  contenu:    { color: '#16A34A', bg: 'rgba(22,163,74,.12)',  label: 'Création',   icon: '✍️' },
  habitude:   { color: '#7C3AED', bg: 'rgba(124,58,237,.12)', label: 'Habitude',    icon: '📌' }
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Parkinsans:wght@400;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Parkinsans',-apple-system,sans-serif;background:#FAF9F2}
.wrapper{min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:2.5rem 1rem 3rem;position:relative;background:#FAF9F2;overflow:hidden}
.blob{position:fixed;border-radius:50%;background:#018EBB;filter:blur(100px);opacity:.18;pointer-events:none;z-index:0}
.blob-1{width:480px;height:480px;top:-140px;left:-150px}
.blob-2{width:350px;height:350px;top:35%;right:-100px}
.grain{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;opacity:.09;z-index:1}
.qouter{position:relative;z-index:2;width:100%;max-width:640px;border-radius:24px;border:10px solid rgba(18,28,40,.08);background:#FAF9F2}
.qcard{background:#FAF9F2;border-radius:16px;padding:2.5rem 2rem}
.prog-bar{height:4px;background:rgba(18,28,40,.08);border-radius:2px;margin-bottom:2rem;overflow:hidden}
.prog-fill{height:100%;background:#018EBB;border-radius:2px;transition:width .4s ease}
.badge{display:inline-block;background:#018EBB;color:#fff;border-radius:20px;padding:4px 12px;font-size:11px;text-transform:uppercase;font-weight:700;letter-spacing:.08em;margin-bottom:1rem}
h1,h2{font-size:1.5rem;font-weight:800;color:#121C28;line-height:1.2;margin-bottom:.5rem}
.sub{font-size:.88rem;color:#4a5568;line-height:1.6;margin-bottom:1.5rem}
.lbl{display:block;font-size:.83rem;font-weight:700;color:#121C28;margin-bottom:.35rem}
.hint{font-size:.77rem;color:#718096;margin-bottom:.55rem;margin-top:-.2rem;font-style:italic}
.inp{width:100%;background:#fff;border:1.5px solid rgba(18,28,40,.15);border-radius:12px;padding:12px 16px;font-family:inherit;font-size:.87rem;color:#121C28;margin-bottom:.85rem;outline:none;transition:border-color .2s}
.inp:focus{border-color:#018EBB}
.inp::placeholder{color:#a0aec0}
.inp-area{width:100%;background:#fff;border:1.5px solid rgba(18,28,40,.15);border-radius:12px;padding:12px 16px;font-family:inherit;font-size:.85rem;color:#121C28;outline:none;transition:border-color .2s;resize:vertical;min-height:90px;line-height:1.55;margin-bottom:.85rem}
.inp-area:focus{border-color:#018EBB}
.inp-area::placeholder{color:#a0aec0}
.choice-grid{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1.25rem}
.choice-card{background:#fff;border:2px solid rgba(18,28,40,.12);border-radius:14px;padding:1.1rem 1rem;cursor:pointer;transition:all .18s;text-align:left;font-family:inherit}
.choice-card:hover{border-color:#018EBB;background:rgba(1,142,187,.04)}
.choice-card.sel{border-color:#018EBB;background:rgba(1,142,187,.08)}
.choice-title{font-size:.9rem;font-weight:800;color:#121C28;margin-bottom:3px}
.choice-desc{font-size:.76rem;color:#718096;line-height:1.4}
.choice-3{display:flex;flex-direction:column;gap:.5rem;margin-bottom:1.25rem}
.choice-row{background:#fff;border:1.5px solid rgba(18,28,40,.12);border-radius:12px;padding:12px 16px;cursor:pointer;transition:all .18s;font-family:inherit;text-align:left;font-size:.87rem;color:#121C28;font-weight:600}
.choice-row:hover{border-color:#018EBB;background:rgba(1,142,187,.04)}
.choice-row.sel{border-color:#018EBB;background:rgba(1,142,187,.08);color:#018EBB}
.divider{height:1px;background:rgba(18,28,40,.08);margin:1.25rem 0}
.btn-p{width:100%;background:#121C28;color:#fff;border:none;border-radius:12px;padding:14px;font-family:inherit;font-size:.92rem;font-weight:700;cursor:pointer;transition:opacity .2s}
.btn-p:hover{opacity:.88}
.btn-p:disabled{opacity:.35;cursor:not-allowed}
.btn-b{flex:1;background:#018EBB;color:#fff;border:none;border-radius:12px;padding:12px 20px;font-family:inherit;font-size:.87rem;font-weight:700;cursor:pointer;transition:opacity .2s}
.btn-b:hover{opacity:.88}
.btn-g{flex:1;background:transparent;color:#718096;border:1.5px solid rgba(18,28,40,.12);border-radius:12px;padding:12px 20px;font-family:inherit;font-size:.84rem;font-weight:600;cursor:pointer;transition:all .18s}
.btn-g:hover{border-color:#018EBB;color:#018EBB}
.btn-row{display:flex;gap:.7rem;margin-top:1rem}
.btn-dl{width:100%;background:transparent;color:#018EBB;border:1.5px solid #018EBB;border-radius:12px;padding:13px;font-family:inherit;font-size:.88rem;font-weight:700;cursor:pointer;transition:all .2s;margin-top:.6rem}
.btn-dl:hover{background:rgba(1,142,187,.07)}
.q-block{margin-bottom:1.3rem}
.q-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:.35rem}
.q-num{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background:#018EBB;color:#fff;border-radius:50%;font-size:.72rem;font-weight:800;flex-shrink:0;margin-top:1px}
.q-title{font-size:.87rem;font-weight:700;color:#121C28;line-height:1.4}
.q-hint{font-size:.77rem;color:#a0aec0;margin-bottom:.45rem;padding-left:34px;font-style:italic}
/* Ancre screen */
.ancre-cards{display:flex;flex-direction:column;gap:.75rem;margin-bottom:1.25rem}
.ancre-card{display:flex;align-items:flex-start;gap:12px;border-radius:14px;padding:1rem 1.1rem;border:1.5px solid transparent}
.ancre-blue{background:rgba(1,142,187,.07);border-color:rgba(1,142,187,.2)}
.ancre-green{background:rgba(22,163,74,.07);border-color:rgba(22,163,74,.2)}
.ancre-purple{background:rgba(124,58,237,.07);border-color:rgba(124,58,237,.2)}
.ancre-orange{background:rgba(234,88,12,.07);border-color:rgba(234,88,12,.2)}
.ancre-ico{font-size:1.3rem;flex-shrink:0;margin-top:1px}
.ancre-lbl{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.ancre-blue .ancre-lbl{color:#018EBB}
.ancre-green .ancre-lbl{color:#16A34A}
.ancre-purple .ancre-lbl{color:#7C3AED}
.ancre-orange .ancre-lbl{color:#EA580C}
.ancre-quote{font-size:.84rem;font-weight:700;color:#121C28;margin-bottom:4px;font-style:italic}
.ancre-what{font-size:.78rem;color:#4a5568;line-height:1.45}
.insight-box{background:#121C28;color:#fff;border-radius:14px;padding:1rem 1.2rem;font-size:.82rem;line-height:1.6;margin-bottom:1.25rem}
.insight-box strong{color:#018EBB}
/* Tag input */
.tag-section{margin-bottom:1.1rem}
.tag-section-lbl{font-size:.8rem;font-weight:800;color:#121C28;margin-bottom:.35rem;display:flex;align-items:center;gap:6px}
.tag-row{display:flex;gap:.5rem;margin-bottom:.45rem}
.tag-inp{flex:1;background:#fff;border:1.5px solid rgba(18,28,40,.12);border-radius:10px;padding:9px 14px;font-family:inherit;font-size:.84rem;color:#121C28;outline:none;transition:border-color .2s}
.tag-inp:focus{border-color:#018EBB}
.tag-inp::placeholder{color:#a0aec0}
.tag-add-btn{background:#018EBB;color:#fff;border:none;border-radius:10px;padding:9px 14px;font-family:inherit;font-size:.84rem;font-weight:700;cursor:pointer;transition:opacity .2s;white-space:nowrap}
.tag-add-btn:hover{opacity:.88}
.tags-list{display:flex;flex-wrap:wrap;gap:5px;min-height:8px}
.tag-chip{display:flex;align-items:center;gap:5px;background:rgba(1,142,187,.10);color:#018EBB;border-radius:20px;padding:4px 10px 4px 12px;font-size:.78rem;font-weight:700}
.tag-rm{background:none;border:none;cursor:pointer;color:#018EBB;font-size:.85rem;line-height:1;padding:0;opacity:.6}
.tag-rm:hover{opacity:1}
/* Calendar page */
.cal-page{position:relative;z-index:2;width:100%;max-width:1140px}
.cal-header-bar{background:#FAF9F2;border-radius:16px 16px 0 0;padding:1.4rem 1.5rem .9rem;border:10px solid rgba(18,28,40,.08);border-bottom:none}
.cal-body-wrap{border:10px solid rgba(18,28,40,.08);border-top:none;border-radius:0 0 16px 16px;background:#FAF9F2;padding:0 1rem 1.5rem}
.cal-layout{display:flex;gap:1rem;align-items:flex-start}
/* Palette */
.palette{width:170px;flex-shrink:0}
.pal-section{background:#fff;border:1.5px solid rgba(18,28,40,.09);border-radius:12px;padding:.7rem .8rem;margin-bottom:.6rem}
.pal-section-hdr{font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.5rem;display:flex;align-items:center;gap:5px}
.pal-section-hdr.eng{color:#018EBB}
.pal-section-hdr.cre{color:#16A34A}
.pal-section-hdr.hab{color:#7C3AED}
.p-chip{display:flex;align-items:center;gap:6px;border-radius:9px;padding:7px 10px;font-size:.78rem;font-weight:700;color:#fff;cursor:grab;user-select:none;border:none;text-align:left;font-family:inherit;width:100%;transition:transform .15s,opacity .15s;margin-bottom:.35rem}
.p-chip:last-child{margin-bottom:0}
.p-chip:active{cursor:grabbing;opacity:.85;transform:scale(.97)}
.p-chip-icon{font-size:.85rem;flex-shrink:0}
.p-chip-label{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.palette-new-form{display:flex;flex-direction:column;gap:.35rem;margin-top:.4rem}
.palette-new-inp{background:#FAF9F2;border:1.5px solid rgba(18,28,40,.12);border-radius:8px;padding:6px 10px;font-family:inherit;font-size:.79rem;color:#121C28;outline:none;width:100%}
.palette-new-inp:focus{border-color:#7C3AED}
.palette-new-btn{background:#7C3AED;color:#fff;border:none;border-radius:8px;padding:6px;font-family:inherit;font-size:.77rem;font-weight:700;cursor:pointer;width:100%}
.palette-add{width:100%;background:none;border:1.5px dashed rgba(124,58,237,.25);border-radius:9px;padding:7px;font-family:inherit;font-size:.75rem;font-weight:700;color:#a0aec0;cursor:pointer;transition:all .18s;margin-top:.35rem}
.palette-add:hover{border-color:#7C3AED;color:#7C3AED;background:rgba(124,58,237,.04)}
.palette-hint{font-size:.67rem;color:#a0aec0;line-height:1.4;margin-top:.5rem;text-align:center}
/* Calendar grid */
.cal-outer{flex:1;overflow-x:auto;min-width:0}
.cal-sticky-header{display:flex;padding-left:44px;margin-bottom:3px;gap:0}
.cal-day-hdr{flex:1;text-align:center;font-size:.75rem;font-weight:800;color:#121C28;padding:5px 0}
.cal-scroll{overflow-y:auto;max-height:560px;border-radius:10px;border:1.5px solid rgba(18,28,40,.08)}
.cal-inner{display:flex}
.time-col{width:44px;flex-shrink:0;position:sticky;left:0;z-index:3}
.time-lbl{height:56px;display:flex;align-items:flex-start;justify-content:flex-end;padding-right:8px;padding-top:3px;font-size:.65rem;font-weight:700;color:#a0aec0}
.days-row{display:flex;flex:1}
.day-col{flex:1;min-width:76px;position:relative;border-left:1px solid rgba(18,28,40,.06)}
.zone-band{position:absolute;left:0;right:0;pointer-events:none}
.zone-am{background:rgba(254,243,199,.35)}
.zone-pm{background:rgba(219,234,254,.25)}
.zone-label-row{position:absolute;left:0;right:0;height:18px;display:flex;align-items:center;padding-left:4px;z-index:1;pointer-events:none}
.zone-label-txt{font-size:.58rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;opacity:.55}
.zone-label-am{color:#92400E}
.zone-label-pm{color:#1E40AF}
.grid-line{position:absolute;left:0;right:0;pointer-events:none}
.grid-line-hour{border-top:1px solid rgba(18,28,40,.09)}
.grid-line-half{border-top:1px dashed rgba(18,28,40,.04)}
.grid-noon{border-top:2px solid rgba(1,142,187,.2)}
.cal-block{position:absolute;left:2px;right:2px;border-radius:7px;overflow:hidden;cursor:grab;user-select:none;z-index:2;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(0,0,0,.15)}
.cal-block:active{cursor:grabbing}
.cal-block-inner{flex:1;padding:3px 6px 3px;overflow:hidden}
.cal-block-type{font-size:.6rem;opacity:.85;line-height:1;margin-bottom:1px}
.cal-block-label{font-size:.7rem;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.25}
.cal-block-time{font-size:.58rem;color:rgba(255,255,255,.75);line-height:1.2}
.cal-block-rm{position:absolute;top:2px;right:3px;background:rgba(0,0,0,.2);border:none;border-radius:3px;color:#fff;font-size:.65rem;cursor:pointer;padding:0 3px;line-height:1.4;opacity:0;transition:opacity .15s;font-family:inherit}
.cal-block:hover .cal-block-rm{opacity:1}
.cal-block-resize{height:7px;background:rgba(0,0,0,.15);cursor:ns-resize;border-radius:0 0 7px 7px;flex-shrink:0}
.cal-block-resize:hover{background:rgba(0,0,0,.28)}
/* Result */
.ok-banner{background:rgba(34,197,94,.08);border:1.5px solid rgba(34,197,94,.25);border-radius:12px;padding:12px 16px;display:flex;align-items:flex-start;gap:10px;margin-bottom:1rem;font-size:.82rem;color:#15803d;font-weight:600;line-height:1.45}
.err-banner{background:rgba(239,68,68,.06);border:1.5px solid rgba(239,68,68,.2);border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:8px;margin-bottom:1rem;font-size:.82rem;color:#b91c1c;font-weight:600}
.res-hero{background:#121C28;color:#fff;border-radius:16px;padding:1.4rem 1.5rem;margin-bottom:.85rem}
.res-hero-label{font-size:.68rem;font-weight:800;color:#018EBB;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.5rem}
.res-hero-title{font-size:1.05rem;font-weight:800;color:#fff;margin-bottom:.35rem}
.res-hero-body{font-size:.82rem;color:rgba(255,255,255,.7);line-height:1.55}
.res-block{background:#fff;border:1.5px solid rgba(18,28,40,.10);border-radius:14px;padding:1rem 1.25rem;margin-bottom:.75rem}
.res-block-hl{background:rgba(1,142,187,.06);border:1.5px solid rgba(1,142,187,.18);border-radius:14px;padding:1rem 1.25rem;margin-bottom:.75rem}
.res-label{font-size:.68rem;font-weight:800;color:#018EBB;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.45rem}
.res-title{font-size:.92rem;font-weight:800;color:#121C28;margin-bottom:.3rem}
.res-body{font-size:.81rem;color:#4a5568;line-height:1.55}
.week-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:.5rem;margin-top:.6rem}
.week-day-card{background:#fff;border:1.5px solid rgba(18,28,40,.08);border-radius:10px;padding:.6rem .7rem}
.week-day-name{font-size:.7rem;font-weight:800;color:#121C28;margin-bottom:.35rem}
.week-chip{display:flex;align-items:center;gap:4px;border-radius:5px;padding:2px 6px;font-size:.67rem;font-weight:700;color:#fff;margin-bottom:2px}
.fn{font-size:.72rem;color:#a0aec0;text-align:center;margin-top:.75rem}
`

// ─── Grain ────────────────────────────────────────────────────────────────────
function Grain() {
  return (
    <svg className="grain" xmlns="http://www.w3.org/2000/svg">
      <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#gr)"/>
    </svg>
  )
}

// ─── TagSection ───────────────────────────────────────────────────────────────
function TagSection({ emoji, label, category, tags, input, onInput, onAdd, onRemove }) {
  return (
    <div className="tag-section">
      <div className="tag-section-lbl"><span>{emoji}</span>{label}</div>
      <div className="tag-row">
        <input className="tag-inp" placeholder="Tape et appuie sur Entrée" value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); onAdd(input) } }}
        />
        <button className="tag-add-btn" onClick={() => onAdd(input)}>+</button>
      </div>
      <div className="tags-list">
        {tags.map(t => (
          <div key={t} className="tag-chip">{t}<button className="tag-rm" onClick={() => onRemove(t)}>×</button></div>
        ))}
      </div>
    </div>
  )
}

// ─── CalBlock ─────────────────────────────────────────────────────────────────
function CalBlock({ block, onDragStart, onRemove, onResizeStart }) {
  const topPx = (block.startSlot - DS) * SH
  const heightPx = block.duration * SH
  const bt = BTYPE[block.type] || BTYPE.habitude
  const showLabel = heightPx >= 22
  const showTime = heightPx >= 36

  return (
    <div className="cal-block" style={{ top: topPx, height: heightPx, background: bt.color }}
      draggable onDragStart={e => onDragStart(e, block)}>
      <button className="cal-block-rm" onClick={e => { e.stopPropagation(); onRemove(block.id) }}>×</button>
      <div className="cal-block-inner">
        {showLabel && <div className="cal-block-type">{bt.icon}</div>}
        {showLabel && <div className="cal-block-label">{block.label}</div>}
        {showTime && <div className="cal-block-time">{toTime(block.startSlot)} → {toTime(block.startSlot + block.duration)}</div>}
      </div>
      <div className="cal-block-resize" onMouseDown={e => onResizeStart(e, block)} />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WorkbookOrga() {
  const [screen, setScreen] = useState('home')

  // Home
  const [name, setName] = useState('')
  const [workStyle, setWorkStyle] = useState('')
  const [weekendAvail, setWeekendAvail] = useState('')

  // Revelation
  const [rev, setRev] = useState({ productive: '', daily: '', flowPlace: '', creativeTime: '', linkedinMoment: '' })

  // Contexte
  const [ctx, setCtx] = useState({ flowObject: '', habitAnchor: '' })

  // WOOP
  const [woop, setWoop] = useState({ engagement: '', production: '' })

  // Habits
  const [habitInputs, setHabitInputs] = useState({ matin: '', aprem: '', weekend: '' })
  const [habitTags, setHabitTags] = useState({ matin: [], aprem: [], weekend: [] })

  // Calendar
  const [paletteHabits, setPaletteHabits] = useState([])
  const [blocks, setBlocks] = useState([])
  const [newHabitVal, setNewHabitVal] = useState('')
  const [showNewHabit, setShowNewHabit] = useState(false)

  // Result
  const [resultHtml, setResultHtml] = useState('')
  const [slackOk, setSlackOk] = useState(false)
  const [slackErr, setSlackErr] = useState('')

  // Refs
  const dragPayload = useRef(null)
  const resizeState = useRef(null)

  const DAYS = weekendAvail === 'non' ? ALL_DAYS.slice(0, 5) : ALL_DAYS

  const go = s => { setScreen(s); window.scrollTo(0, 0) }

  // View mode
  useState(() => {
    const params = new URLSearchParams(window.location.search)
    const viewId = params.get('view')
    if (!viewId) return
    supabase.from('workbook_organisation').select('nom, result_html').eq('id', viewId).single()
      .then(({ data }) => { if (data) { setName(data.nom); setResultHtml(data.result_html); setScreen('result') } })
  })

  // Sync habits palette from tags
  useEffect(() => {
    const allTags = [...habitTags.matin, ...habitTags.aprem, ...(weekendAvail !== 'non' ? habitTags.weekend : [])]
    const unique = [...new Set(allTags)]
    setPaletteHabits(prev => {
      const map = new Map(prev.map(h => [h.label.toLowerCase(), h]))
      return unique.map(label => map.get(label.toLowerCase()) || { id: uid(), label })
    })
  }, [habitTags, weekendAvail])

  // Tag helpers
  const addTag = (cat, val) => {
    const v = val.trim(); if (!v) return
    setHabitTags(p => ({ ...p, [cat]: p[cat].includes(v) ? p[cat] : [...p[cat], v] }))
    setHabitInputs(p => ({ ...p, [cat]: '' }))
  }
  const removeTag = (cat, tag) => setHabitTags(p => ({ ...p, [cat]: p[cat].filter(t => t !== tag) }))

  // ── Calendar drag / drop ───────────────────────────────────────────────────
  const onPaletteDragStart = (e, type, label) => {
    dragPayload.current = { kind: 'new', type, label }
    e.dataTransfer.effectAllowed = 'copy'
  }

  const onBlockDragStart = (e, block) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const offsetSlots = Math.floor((e.clientY - rect.top) / SH)
    dragPayload.current = { kind: 'move', block, offsetSlots }
    e.dataTransfer.effectAllowed = 'move'
    e.stopPropagation()
  }

  const onDayDrop = (e, dayIdx) => {
    e.preventDefault()
    const p = dragPayload.current; if (!p) return
    const rect = e.currentTarget.getBoundingClientRect()
    const slot = DS + Math.floor((e.clientY - rect.top) / SH)

    if (p.kind === 'new') {
      const defaultDur = p.type === 'engagement' ? 4 : p.type === 'contenu' ? 8 : 4
      setBlocks(prev => [...prev, {
        id: uid(), day: dayIdx, type: p.type,
        startSlot: Math.max(DS, Math.min(DE - defaultDur, slot)),
        duration: defaultDur, label: p.label,
        color: BTYPE[p.type]?.color || '#8B5CF6'
      }])
    } else if (p.kind === 'move') {
      const newStart = Math.max(DS, Math.min(DE - p.block.duration, slot - p.offsetSlots))
      setBlocks(prev => prev.map(b => b.id === p.block.id ? { ...b, day: dayIdx, startSlot: newStart } : b))
    }
    dragPayload.current = null
  }

  const removeBlock = id => setBlocks(p => p.filter(b => b.id !== id))

  const onResizeStart = (e, block) => {
    e.preventDefault(); e.stopPropagation()
    resizeState.current = { blockId: block.id, startY: e.clientY, startDuration: block.duration, maxDuration: DE - block.startSlot }
  }

  useEffect(() => {
    const onMove = e => {
      const rs = resizeState.current; if (!rs) return
      const delta = e.clientY - rs.startY
      const newDur = Math.max(1, Math.min(rs.maxDuration, rs.startDuration + Math.round(delta / SH)))
      setBlocks(prev => prev.map(b => b.id === rs.blockId ? { ...b, duration: newDur } : b))
    }
    const onUp = () => { resizeState.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])

  const addNewHabit = () => {
    const v = newHabitVal.trim(); if (!v) return
    if (!paletteHabits.find(h => h.label.toLowerCase() === v.toLowerCase()))
      setPaletteHabits(p => [...p, { id: uid(), label: v }])
    setNewHabitVal(''); setShowNewHabit(false)
  }

  // ── Analysis ───────────────────────────────────────────────────────────────
  const analyzeCalendar = () => {
    const dayResults = DAYS.map((_, di) => {
      const occupied = new Set()
      blocks.filter(b => b.day === di).forEach(b => { for (let s = b.startSlot; s < b.startSlot + b.duration; s++) occupied.add(s) })
      const free = []
      for (let s = DS; s < DE; s++) if (!occupied.has(s)) free.push(s)
      const contiguous = []
      let cur = null
      free.forEach(s => {
        if (!cur) { cur = { start: s, len: 1 }; return }
        if (s === cur.start + cur.len) { cur.len++; return }
        contiguous.push(cur); cur = { start: s, len: 1 }
      })
      if (cur) contiguous.push(cur)
      const maxBlock = contiguous.length ? contiguous.reduce((m, c) => c.len > m.len ? c : m) : { start: DS, len: 0 }
      return { di, maxBlock }
    })

    const daysWithLarge = dayResults.filter(r => r.maxBlock.len >= 8)
    const bestDay = dayResults.reduce((best, r) => r.maxBlock.len > best.maxBlock.len ? r : best)
    const canBatch = daysWithLarge.length >= 1
    const preferBatching = workStyle === 'batching'

    let verdict, explanation, advice
    if (preferBatching && canBatch) {
      verdict = '✅ Batching validé'
      explanation = `Tu as ${daysWithLarge.length} jour(s) avec des créneaux libres de 2h+ — le batching correspond à ton organisation.`
      advice = "Réserve un grand bloc hebdomadaire pour produire tout ton contenu d'un coup."
    } else if (preferBatching && !canBatch) {
      verdict = '⚠️ Batching difficile à tenir'
      explanation = "Tu préfères le batching, mais ton planning ne libère pas de créneau de 2h+. Deux options : libérer un grand bloc ou adopter les micro-sessions d'ici là."
      advice = "Pour l'instant, des sessions de 30 min × 3 fois/semaine seront plus réalistes."
    } else if (!preferBatching && canBatch) {
      verdict = '💡 Micro-sessions OK, batching possible'
      explanation = "Tu préfères les micro-sessions, mais tu as des créneaux de 2h+ disponibles. Le batching pourrait te faire gagner en fluidité créative."
      advice = "Si les micro-sessions fonctionnent bien, garde-les. Sinon on a les ressources pour basculer."
    } else {
      verdict = '✅ Micro-sessions validées'
      explanation = "Tes journées sont bien remplies — les micro-sessions de 20-30 min sont la bonne approche."
      advice = "Identifie 3 micro-slots dans ta semaine et bloque-les comme des réunions."
    }

    const oneBloc = bestDay.maxBlock
    const oneBlocLabel = oneBloc.len > 0
      ? `${DAYS[bestDay.di]} · ${toTime(oneBloc.start)} → ${toTime(oneBloc.start + oneBloc.len)} (${Math.round(oneBloc.len * 15 / 60 * 10) / 10}h)`
      : 'À identifier ensemble'

    const engBlocks = blocks.filter(b => b.type === 'engagement')
    const engDays = [...new Set(engBlocks.map(b => DAYS[b.day]))]
    const engTime = engBlocks.length > 0 ? toTime(Math.round(engBlocks.reduce((s, b) => s + b.startSlot, 0) / engBlocks.length)) : null

    return { verdict, explanation, advice, oneBlocLabel, engDays, engTime, canBatch }
  }

  // ── Build result HTML ──────────────────────────────────────────────────────
  const buildResultHtml = () => {
    const a = analyzeCalendar()

    const weekRows = DAYS.map((day, di) => {
      const dayBlocks = blocks.filter(b => b.day === di).sort((a, b) => a.startSlot - b.startSlot)
      const chips = dayBlocks.map(b => {
        const bt = BTYPE[b.type] || BTYPE.habitude
        return `<span style="display:inline-flex;align-items:center;gap:3px;background:${bt.color};border-radius:5px;padding:2px 8px;font-size:.7rem;font-weight:700;color:#fff;margin:2px">${bt.icon} ${toTime(b.startSlot)} ${b.label} (${b.duration * 15}min)</span>`
      }).join('')
      return `<div style="margin-bottom:.55rem"><span style="font-size:.75rem;font-weight:800;color:#121C28;display:inline-block;width:32px">${day}</span>${chips || '<span style="font-size:.72rem;color:#a0aec0;font-style:italic">Libre</span>'}</div>`
    }).join('')

    const engSection = a.engTime ? `<div class="res-block-hl"><div class="res-label">💬 Ton moment quotidien LinkedIn</div><div class="res-title">${a.engTime} — ${a.engDays.join(', ')}</div><div class="res-body">C'est ici que se greffent ta routine d'engagement et la publication de tes posts.</div></div>` : ''

    return `
      ${engSection}
      <div class="res-block-hl"><div class="res-label">🎯 Ton ONE bloc de production</div><div class="res-title">${a.oneBlocLabel}</div><div class="res-body">Le créneau qui, s'il tient, fait tomber tous les autres dominos.</div></div>
      <div class="res-block"><div class="res-label">Diagnostic</div><div class="res-title">${a.verdict}</div><div class="res-body" style="margin-bottom:.4rem">${a.explanation}</div><div class="res-body" style="font-style:italic">${a.advice}</div></div>
      <div class="res-block"><div class="res-label">Ta semaine</div>${weekRows}</div>
      <div class="res-block"><div class="res-label">Ton ancre d'engagement</div><div class="res-body">${ctx.habitAnchor || rev.linkedinMoment || 'Non renseigné'}</div></div>
      <div class="res-block"><div class="res-label">Ta projection</div><div class="res-body" style="margin-bottom:.4rem"><strong>Engagement :</strong> ${woop.engagement || '—'}</div><div class="res-body"><strong>Création :</strong> ${woop.production || '—'}</div></div>
    `
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const resHtml = buildResultHtml()
    setResultHtml(resHtml); go('result')
    setSlackOk(false); setSlackErr('')
    try {
      const { data: row, error } = await supabase.from('workbook_organisation')
        .insert({ nom: name, result_html: resHtml, data: { workStyle, weekendAvail, rev, ctx, woop, habitTags, blocks } })
        .select('id').single()
      if (error) throw error
      const html_url = `${window.location.origin}?view=${row.id}`
      const resp = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: name, workStyle, linkedinMoment: rev.linkedinMoment, html_url }) })
      if (resp.ok) setSlackOk(true); else setSlackErr(`Erreur ${resp.status}`)
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
    const a = document.createElement('a'); a.href = url
    a.download = `Kalanis_Orga_${name.replace(/\s+/g, '_')}.html`
    a.click(); URL.revokeObjectURL(url)
  }

  const resetAll = () => {
    setScreen('home'); setName(''); setWorkStyle(''); setWeekendAvail('')
    setRev({ productive: '', daily: '', flowPlace: '', creativeTime: '', linkedinMoment: '' })
    setCtx({ flowObject: '', habitAnchor: '' })
    setWoop({ engagement: '', production: '' })
    setHabitInputs({ matin: '', aprem: '', weekend: '' })
    setHabitTags({ matin: [], aprem: [], weekend: [] })
    setPaletteHabits([]); setBlocks([])
    setSlackOk(false); setSlackErr(''); setResultHtml('')
  }

  const totalTags = habitTags.matin.length + habitTags.aprem.length + (weekendAvail !== 'non' ? habitTags.weekend.length : 0)
  const prog = { home: 0, revelation: 12, ancre: 25, contexte: 38, woop: 50, habits: 63, calendar: 80, result: 100 }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="wrapper">
        <div className="blob blob-1" /><div className="blob blob-2" />
        <Grain />

        {/* ── HOME ── */}
        {screen === 'home' && (
          <div className="qouter"><div className="qcard">
            <div className="badge">Kalanis • Organisation</div>
            <h1>Construis ta routine de création</h1>
            <p className="sub">Avant de planifier, on va cartographier ta semaine réelle — pas idéale. 20 minutes pour avoir de la clarté sur comment ancrer durablement ta présence LinkedIn.</p>
            <div className="divider" />
            <span className="lbl">Ton prénom et nom *</span>
            <input className="inp" placeholder="ex : Marie Dupont" value={name} onChange={e => setName(e.target.value)} />

            <span className="lbl" style={{ marginBottom: '.6rem', display: 'block' }}>Comment tu imagines produire ton contenu ? *</span>
            <div className="choice-grid">
              <button className={`choice-card${workStyle === 'batching' ? ' sel' : ''}`} onClick={() => setWorkStyle('batching')}>
                <div className="choice-title">🧱 Batching</div>
                <div className="choice-desc">1 grand bloc par semaine pour tout produire d'un coup</div>
              </button>
              <button className={`choice-card${workStyle === 'micro' ? ' sel' : ''}`} onClick={() => setWorkStyle('micro')}>
                <div className="choice-title">⚡ Micro-sessions</div>
                <div className="choice-desc">Plusieurs sessions courtes de 20-30 min dans la semaine</div>
              </button>
            </div>

            <span className="lbl">Le weekend est-il disponible pour le contenu ? *</span>
            <div className="choice-3">
              {[['oui', 'Oui, le weekend est dispo'], ['parfois', 'Parfois, ça dépend'], ['non', 'Non, le weekend est sacré']].map(([v, l]) => (
                <button key={v} className={`choice-row${weekendAvail === v ? ' sel' : ''}`} onClick={() => setWeekendAvail(v)}>{l}</button>
              ))}
            </div>

            <button className="btn-p" disabled={!name.trim() || !workStyle || !weekendAvail} onClick={() => go('revelation')}>Commencer →</button>
          </div></div>
        )}

        {/* ── REVELATION ── */}
        {screen === 'revelation' && (
          <div className="qouter"><div className="qcard">
            <div className="prog-bar"><div className="prog-fill" style={{ width: '12%' }} /></div>
            <div className="badge">Révélation · Tes patterns cachés</div>
            <h2>Décris ta vraie semaine</h2>
            <p className="sub">Pas de bonne ou mauvaise réponse. Ces questions font émerger tes patterns réels — souvent invisibles à ceux qui les vivent.</p>

            <div className="q-block">
              <div className="q-row"><span className="q-num">1</span><span className="q-title">Décris ta dernière journée vraiment productive — du matin jusqu'au soir. Pas idéale, vraiment productive.</span></div>
              <p className="q-hint">Heure de réveil, ce qui a déclenché la journée, ce qui l'a rendue différente des autres.</p>
              <textarea className="inp-area" placeholder="ex : Je me suis levé à 6h30, j'ai fait 30 min de sport avant de commencer, pas de téléphone avant 9h..." value={rev.productive} onChange={e => setRev(p => ({ ...p, productive: e.target.value }))} />
            </div>

            <div className="q-block">
              <div className="q-row"><span className="q-num">2</span><span className="q-title">Qu'est-ce que tu fais CHAQUE jour, sans exception, même les jours les plus chaotiques ?</span></div>
              <p className="q-hint">Café, douche froide, tour du quartier, check emails… Peu importe si ça semble anodin.</p>
              <input className="inp" placeholder="ex : Mon café du matin, ma douche froide, 5 min de lecture..." value={rev.daily} onChange={e => setRev(p => ({ ...p, daily: e.target.value }))} />
            </div>

            <div className="q-block">
              <div className="q-row"><span className="q-num">3</span><span className="q-title">Dans quel endroit tu travailles vraiment bien — pas où tu devrais, mais où ça marche vraiment ?</span></div>
              <p className="q-hint">Le bureau à domicile, la table du salon, un café, le balcon… Et dans quel contexte (seul, musique, silence ?)</p>
              <input className="inp" placeholder="ex : La table du salon avec de la musique lo-fi, pas mon bureau — trop « travail »..." value={rev.flowPlace} onChange={e => setRev(p => ({ ...p, flowPlace: e.target.value }))} />
            </div>

            <div className="q-block">
              <div className="q-row"><span className="q-num">4</span><span className="q-title">À quelle heure tu es dans ton meilleur état pour créer quelque chose de nouveau ?</span></div>
              <p className="q-hint">Distingue ton pic créatif (où tu écris, penses, crées) de ton pic productif (où tu exécutes des tâches). Ce sont souvent deux moments différents.</p>
              <input className="inp" placeholder="ex : Créatif à 14h après le repas, productif à 9h30 sur les tâches répétitives..." value={rev.creativeTime} onChange={e => setRev(p => ({ ...p, creativeTime: e.target.value }))} />
            </div>

            <div className="q-block">
              <div className="q-row"><span className="q-num">5</span><span className="q-title">À quel moment de la journée tu ouvres LinkedIn sans te le forcer ?</span></div>
              <p className="q-hint">Pas quand tu devrais — quand tu le fais vraiment. Le scroll du matin, la pause de midi, avant de dormir…</p>
              <input className="inp" placeholder="ex : Le matin avec mon café vers 8h, ou en fin d'après-midi vers 17h..." value={rev.linkedinMoment} onChange={e => setRev(p => ({ ...p, linkedinMoment: e.target.value }))} />
            </div>

            <div className="btn-row">
              <button className="btn-g" onClick={() => go('home')}>← Retour</button>
              <button className="btn-b" onClick={() => go('ancre')}>Continuer →</button>
            </div>
          </div></div>
        )}

        {/* ── ANCRE ── */}
        {screen === 'ancre' && (
          <div className="qouter"><div className="qcard">
            <div className="prog-bar"><div className="prog-fill" style={{ width: '25%' }} /></div>
            <div className="badge">Tes ancres naturelles</div>
            <h2>Ce que tu viens de révéler, {name}</h2>
            <p className="sub">Ce ne sont pas des habitudes à créer. Ce sont des infrastructures qui existent déjà — et sur lesquelles on va greffer ta présence LinkedIn.</p>

            <div className="ancre-cards">
              {rev.linkedinMoment && (
                <div className="ancre-card ancre-blue">
                  <span className="ancre-ico">📱</span>
                  <div>
                    <div className="ancre-lbl">Ton moment LinkedIn naturel</div>
                    <div className="ancre-quote">&ldquo;{rev.linkedinMoment}&rdquo;</div>
                    <div className="ancre-what">→ C'est ici que se greffent ta routine d'engagement et la publication de tes posts.</div>
                  </div>
                </div>
              )}
              {rev.daily && (
                <div className="ancre-card ancre-green">
                  <span className="ancre-ico">⚓</span>
                  <div>
                    <div className="ancre-lbl">Ton ancre quotidienne</div>
                    <div className="ancre-quote">&ldquo;{rev.daily}&rdquo;</div>
                    <div className="ancre-what">→ L'habitude sur laquelle tout le reste peut se greffer. Ton déclencheur naturel.</div>
                  </div>
                </div>
              )}
              {rev.creativeTime && (
                <div className="ancre-card ancre-orange">
                  <span className="ancre-ico">⚡</span>
                  <div>
                    <div className="ancre-lbl">Ton pic créatif</div>
                    <div className="ancre-quote">&ldquo;{rev.creativeTime}&rdquo;</div>
                    <div className="ancre-what">→ C'est là que se cale ta session de création de contenu.</div>
                  </div>
                </div>
              )}
              {rev.flowPlace && (
                <div className="ancre-card ancre-purple">
                  <span className="ancre-ico">🏡</span>
                  <div>
                    <div className="ancre-lbl">Ton lieu de flow</div>
                    <div className="ancre-quote">&ldquo;{rev.flowPlace}&rdquo;</div>
                    <div className="ancre-what">→ Le contexte dans lequel tu travailles vraiment. C'est là qu'on place tes sessions.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="insight-box">
              <strong>La règle des deux blocs :</strong> Ta routine d'engagement (quotidienne, 20-30 min) et ta session de création ({workStyle === 'batching' ? 'un grand bloc hebdomadaire' : 'micro-sessions de 20-30 min'}) sont deux choses distinctes qui ne se mélangent pas. On va trouver la place de chacune.
            </div>

            <div className="btn-row">
              <button className="btn-g" onClick={() => go('revelation')}>← Retour</button>
              <button className="btn-b" onClick={() => go('contexte')}>Continuer →</button>
            </div>
          </div></div>
        )}

        {/* ── CONTEXTE ── */}
        {screen === 'contexte' && (
          <div className="qouter"><div className="qcard">
            <div className="prog-bar"><div className="prog-fill" style={{ width: '38%' }} /></div>
            <div className="badge">Le conteneur</div>
            <h2>Concevoir le contexte</h2>
            <p className="sub">Le comportement change quand le contexte change — pas quand la motivation change. On ne cherche pas à te motiver. On cherche à concevoir le bon conteneur.</p>

            <div className="q-block">
              <div className="q-row"><span className="q-num">1</span><span className="q-title">Quel objet ou lieu associes-tu à un état de flow ?</span></div>
              <p className="q-hint">Le bureau, la table, le canapé, le balcon, un Starbucks… L'objet qui déclenche l'état « c'est là que je travaille bien ».</p>
              <input className="inp" placeholder="ex : La table du salon avec mon Mac et une tasse de café..." value={ctx.flowObject} onChange={e => setCtx(p => ({ ...p, flowObject: e.target.value }))} />
            </div>

            <div className="q-block">
              <div className="q-row"><span className="q-num">2</span><span className="q-title">Si ta routine LinkedIn devait se greffer sur quelque chose que tu fais déjà, ce serait quoi ?</span></div>
              <p className="q-hint">Exemle : juste après mon café du matin, pendant ma pause déjeuner, avant de fermer mon ordi le soir…</p>
              <input className="inp" placeholder="ex : Juste après mon café du matin, avant d'ouvrir mes emails..." value={ctx.habitAnchor} onChange={e => setCtx(p => ({ ...p, habitAnchor: e.target.value }))} />
            </div>

            <div className="btn-row">
              <button className="btn-g" onClick={() => go('ancre')}>← Retour</button>
              <button className="btn-b" onClick={() => go('woop')}>Continuer →</button>
            </div>
          </div></div>
        )}

        {/* ── WOOP ── */}
        {screen === 'woop' && (
          <div className="qouter"><div className="qcard">
            <div className="prog-bar"><div className="prog-fill" style={{ width: '50%' }} /></div>
            <div className="badge">Mise en situation</div>
            <h2>Visualise tes deux routines</h2>
            <p className="sub">Le cerveau encode une projection vivante comme un souvenir futur. En te voyant dans la situation, tu programmes déjà le comportement.</p>

            <div className="q-block">
              <div className="q-row"><span className="q-num">1</span><span className="q-title">Routine d'engagement — Imagine que demain ta routine a eu lieu. Tu viens de passer 20 min sur LinkedIn. Qu'est-ce qui s'est passé pour que ça arrive ?</span></div>
              <p className="q-hint">Sois précis·e sur le contexte : où, quand, avec quoi, ce qui a déclenché la session.</p>
              <textarea className="inp-area" placeholder="ex : Je me suis installé à la table avec mon café avant 8h30, j'ai ouvert LinkedIn directement avant mes emails, j'ai commenté 3 posts et répondu à 2 DMs..." value={woop.engagement} onChange={e => setWoop(p => ({ ...p, engagement: e.target.value }))} />
            </div>

            <div className="q-block">
              <div className="q-row"><span className="q-num">2</span><span className="q-title">Session de création — Imagine que cette semaine, ta session de création s'est faite. Qu'est-ce qui l'a rendue possible ?</span></div>
              <p className="q-hint">Qu'est-ce qui a changé par rapport à la semaine dernière ? Qu'est-ce qui était en place ?</p>
              <textarea className="inp-area" placeholder="ex : J'avais bloqué le mercredi matin dans mon agenda, j'avais préparé 3 idées la veille, j'étais au calme..." value={woop.production} onChange={e => setWoop(p => ({ ...p, production: e.target.value }))} />
            </div>

            <div className="btn-row">
              <button className="btn-g" onClick={() => go('contexte')}>← Retour</button>
              <button className="btn-b" onClick={() => go('habits')}>Continuer →</button>
            </div>
          </div></div>
        )}

        {/* ── HABITS ── */}
        {screen === 'habits' && (
          <div className="qouter"><div className="qcard">
            <div className="prog-bar"><div className="prog-fill" style={{ width: '63%' }} /></div>
            <div className="badge">Tes habitudes actuelles</div>
            <h2>Ce qui structure déjà ta semaine</h2>
            <p className="sub">Liste tout ce que tu fais régulièrement — sport, repas en famille, réunions fixes, lecture… Même les choses non-business. Ce sont ces blocs qu'on va placer dans le calendrier pour voir les créneaux disponibles.</p>

            <TagSection emoji="🌅" label="Matin (avant 13h)" category="matin"
              tags={habitTags.matin} input={habitInputs.matin}
              onInput={v => setHabitInputs(p => ({ ...p, matin: v }))}
              onAdd={v => addTag('matin', v)} onRemove={t => removeTag('matin', t)} />

            <TagSection emoji="☀️" label="Après-midi (13h → 20h)" category="aprem"
              tags={habitTags.aprem} input={habitInputs.aprem}
              onInput={v => setHabitInputs(p => ({ ...p, aprem: v }))}
              onAdd={v => addTag('aprem', v)} onRemove={t => removeTag('aprem', t)} />

            {weekendAvail !== 'non' && (
              <TagSection emoji="📅" label="Weekend" category="weekend"
                tags={habitTags.weekend} input={habitInputs.weekend}
                onInput={v => setHabitInputs(p => ({ ...p, weekend: v }))}
                onAdd={v => addTag('weekend', v)} onRemove={t => removeTag('weekend', t)} />
            )}

            <div className="btn-row">
              <button className="btn-g" onClick={() => go('woop')}>← Retour</button>
              <button className="btn-b" disabled={totalTags < 1} onClick={() => go('calendar')}>Placer dans le calendrier →</button>
            </div>
          </div></div>
        )}

        {/* ── CALENDAR ── */}
        {screen === 'calendar' && (
          <div className="cal-page">
            <div className="cal-header-bar">
              <div className="prog-bar" style={{ marginBottom: '.6rem' }}><div className="prog-fill" style={{ width: '80%' }} /></div>
              <div className="badge">Ton planning</div>
              <h2>Place tes routines dans ta semaine</h2>
              <p className="sub" style={{ marginBottom: 0 }}>Glisse les blocs sur les bons créneaux. Redimensionne par le bas. Les zones 🌅 Matin et ☀️ Après-midi sont colorées pour t'aider à te repérer.</p>
            </div>
            <div className="cal-body-wrap">
              <div className="cal-layout">

                {/* Palette */}
                <div className="palette">

                  <div className="pal-section">
                    <div className="pal-section-hdr eng">💬 Engagement</div>
                    <button className="p-chip" style={{ background: BTYPE.engagement.color }}
                      draggable onDragStart={e => onPaletteDragStart(e, 'engagement', 'Routine engagement')}>
                      <span className="p-chip-icon">💬</span>
                      <span className="p-chip-label">Routine engagement</span>
                    </button>
                  </div>

                  <div className="pal-section">
                    <div className="pal-section-hdr cre">✍️ Création</div>
                    <button className="p-chip" style={{ background: BTYPE.contenu.color }}
                      draggable onDragStart={e => onPaletteDragStart(e, 'contenu', workStyle === 'batching' ? 'Session batching' : 'Micro-session')}>
                      <span className="p-chip-icon">✍️</span>
                      <span className="p-chip-label">{workStyle === 'batching' ? 'Session batching' : 'Micro-session'}</span>
                    </button>
                  </div>

                  <div className="pal-section">
                    <div className="pal-section-hdr hab">📌 Habitudes fixes</div>
                    {paletteHabits.map(h => (
                      <button key={h.id} className="p-chip" style={{ background: BTYPE.habitude.color }}
                        draggable onDragStart={e => onPaletteDragStart(e, 'habitude', h.label)}>
                        <span className="p-chip-icon">📌</span>
                        <span className="p-chip-label">{h.label}</span>
                      </button>
                    ))}
                    {!showNewHabit ? (
                      <button className="palette-add" onClick={() => setShowNewHabit(true)}>+ Ajouter une habitude</button>
                    ) : (
                      <div className="palette-new-form">
                        <input className="palette-new-inp" autoFocus placeholder="Nom de l'habitude" value={newHabitVal}
                          onChange={e => setNewHabitVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addNewHabit(); if (e.key === 'Escape') setShowNewHabit(false) }}
                        />
                        <button className="palette-new-btn" onClick={addNewHabit}>Ajouter</button>
                      </div>
                    )}
                  </div>

                  <p className="palette-hint">Glisse · Dépose · Redimensionne</p>
                </div>

                {/* Calendar grid */}
                <div className="cal-outer">
                  <div className="cal-sticky-header">
                    {DAYS.map(d => <div key={d} className="cal-day-hdr">{d}</div>)}
                  </div>
                  <div className="cal-scroll">
                    <div className="cal-inner">
                      {/* Time column */}
                      <div className="time-col" style={{ background: '#FAF9F2' }}>
                        {AM_HOURS.map(s => (
                          <div key={s} className="time-lbl" style={{ height: 56, background: 'rgba(254,243,199,.25)' }}>{Math.floor(s / 4)}h</div>
                        ))}
                        {PM_HOURS.map(s => (
                          <div key={s} className="time-lbl" style={{ height: 56, background: 'rgba(219,234,254,.18)' }}>{Math.floor(s / 4)}h</div>
                        ))}
                      </div>
                      {/* Day columns */}
                      <div className="days-row">
                        {DAYS.map((day, di) => (
                          <div key={di} className="day-col" style={{ height: (DE - DS) * SH }}
                            onDragOver={e => e.preventDefault()} onDrop={e => onDayDrop(e, di)}>

                            {/* Zone backgrounds */}
                            <div className="zone-band zone-am" style={{ top: 0, height: (NOON - DS) * SH }} />
                            <div className="zone-band zone-pm" style={{ top: (NOON - DS) * SH, height: (DE - NOON) * SH }} />

                            {/* Zone labels (first column only) */}
                            {di === 0 && (
                              <>
                                <div className="zone-label-row" style={{ top: 2 }}>
                                  <span className="zone-label-txt zone-label-am">🌅 Matin</span>
                                </div>
                                <div className="zone-label-row" style={{ top: (NOON - DS) * SH + 2 }}>
                                  <span className="zone-label-txt zone-label-pm">☀️ Après-midi</span>
                                </div>
                              </>
                            )}

                            {/* Grid lines */}
                            {[...AM_HOURS, ...PM_HOURS].map(s => (
                              <div key={s}>
                                <div className={`grid-line ${s === NOON ? 'grid-noon' : 'grid-line-hour'}`} style={{ top: (s - DS) * SH }} />
                                {s !== NOON && <div className="grid-line grid-line-half" style={{ top: (s - DS + 2) * SH }} />}
                              </div>
                            ))}

                            {/* Blocks */}
                            {blocks.filter(b => b.day === di).map(block => (
                              <CalBlock key={block.id} block={block}
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
        {screen === 'result' && (() => {
          const a = analyzeCalendar()
          const engBlocks = blocks.filter(b => b.type === 'engagement')
          return (
            <div className="qouter"><div className="qcard">
              <div className="prog-bar"><div className="prog-fill" style={{ width: '100%' }} /></div>
              <div className="badge">Diagnostic ✓</div>
              <h2>Ta routine, {name} 🎯</h2>
              <p className="sub">Voici l'analyse de ta semaine. Le récapitulatif a été envoyé automatiquement — on en parle ensemble.</p>

              {slackOk && <div className="ok-banner"><span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✅</span><span>Récapitulatif envoyé ! Thomas le recevra avant votre call.</span></div>}
              {slackErr && <div className="err-banner"><span>⚠️</span><span>{slackErr}</span></div>}

              {/* ONE daily moment */}
              {engBlocks.length > 0 && (
                <div className="res-hero">
                  <div className="res-hero-label">💬 Ton moment quotidien LinkedIn</div>
                  <div className="res-hero-title">{toTime(Math.round(engBlocks.reduce((s, b) => s + b.startSlot, 0) / engBlocks.length))} — {[...new Set(engBlocks.map(b => DAYS[b.day]))].join(', ')}</div>
                  <div className="res-hero-body">C'est ici que se greffent ta routine d'engagement et la publication de tes posts. Chaque jour, sans exception.</div>
                </div>
              )}

              {/* ONE production bloc */}
              <div className="res-block-hl">
                <div className="res-label">🎯 Ton ONE bloc de production</div>
                <div className="res-title">{a.oneBlocLabel}</div>
                <div className="res-body">Le créneau qui, s'il tient chaque semaine, fait tomber tous les autres dominos.</div>
              </div>

              {/* Diagnostic */}
              <div className="res-block">
                <div className="res-label">Diagnostic</div>
                <div className="res-title">{a.verdict}</div>
                <div className="res-body" style={{ marginBottom: '.4rem' }}>{a.explanation}</div>
                <div className="res-body" style={{ fontStyle: 'italic' }}>{a.advice}</div>
              </div>

              {/* Week visual */}
              <div className="res-block">
                <div className="res-label">Ta semaine planifiée</div>
                <div className="week-grid">
                  {DAYS.map((day, di) => {
                    const db = blocks.filter(b => b.day === di).sort((a, b) => a.startSlot - b.startSlot)
                    return (
                      <div key={di} className="week-day-card">
                        <div className="week-day-name">{day}</div>
                        {db.length === 0 ? <span style={{ fontSize: '.68rem', color: '#a0aec0' }}>Libre</span> : db.map(b => {
                          const bt = BTYPE[b.type] || BTYPE.habitude
                          return <div key={b.id} className="week-chip" style={{ background: bt.color }}>{bt.icon} {toTime(b.startSlot)} {b.label}</div>
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Anchors recap */}
              {(ctx.habitAnchor || rev.linkedinMoment) && (
                <div className="res-block">
                  <div className="res-label">Ton ancre d'engagement</div>
                  <div className="res-body">{ctx.habitAnchor || rev.linkedinMoment}</div>
                </div>
              )}

              <button className="btn-dl" onClick={downloadResult}>⬇ Télécharger le résumé (HTML)</button>
              <button className="btn-g" onClick={resetAll} style={{ marginTop: '.6rem', width: '100%', display: 'block' }}>Recommencer</button>
              <p className="fn">Thomas analysera ce résumé avec toi pour définir ta routine idéale.</p>
            </div></div>
          )
        })()}

      </div>
    </>
  )
}
