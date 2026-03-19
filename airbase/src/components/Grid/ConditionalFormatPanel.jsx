// ConditionalFormatPanel.jsx — Conditional formatting rules manager
import { useState } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

const OPS = ['>', '<', '>=', '<=', 'equals', 'contains', 'is empty', 'is not empty']
const PRESETS = [
  { label:'🔴 High values',   op:'>', val:'100', color:'#FCA5A5', bg:'rgba(239,68,68,0.15)' },
  { label:'🟢 Positive',      op:'>', val:'0',   color:'#6EE7B7', bg:'rgba(52,211,153,0.1)' },
  { label:'🟡 Needs attention',op:'<',val:'50',  color:'#FDE68A', bg:'rgba(251,191,36,0.1)' },
  { label:'🔵 Contains text', op:'contains',val:'',color:'#93C5FD',bg:'rgba(96,165,250,0.1)'},
]

export function ConditionalFormatPanel({ onClose }) {
  const store = useStore()
  const [colIdx, setColIdx] = useState(0)
  const [op,     setOp]     = useState('>')
  const [val,    setVal]    = useState('')
  const [color,  setColor]  = useState('#E2E8F0')
  const [bg,     setBg]     = useState('rgba(239,68,68,0.15)')

  const handleAdd = () => {
    store.addCondRule({ colIdx: Number(colIdx), op, val, color, bg })
  }

  const applyPreset = (p) => {
    setOp(p.op); setVal(p.val); setColor(p.color); setBg(p.bg)
  }

  return (
    <div className="glass-panel rounded-2xl w-80 animate-scale-in overflow-hidden"
      style={{ boxShadow:'0 20px 60px rgba(0,0,0,0.7)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color:'#FBBF24' }} />
          <span className="font-semibold text-sm text-white">Conditional Formatting</span>
        </div>
        <button onClick={onClose} className="fmt-btn"><Plus size={14} style={{ transform:'rotate(45deg)' }} /></button>
      </div>

      <div className="p-5 space-y-5">
        {/* Presets */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'#334155' }}>Quick Presets</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p,i) => (
              <button key={i} onClick={() => applyPreset(p)}
                className="text-left text-xs px-2.5 py-2 rounded-lg transition-all"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#94A3B8' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(99,102,241,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {/* Rule builder */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:'#334155' }}>Custom Rule</p>

          <div className="flex gap-2">
            <select value={colIdx} onChange={e=>setColIdx(e.target.value)}
              className="input-base text-xs py-2 flex-1">
              {store.columns.map((c,i)=><option key={i} value={i}>{c.title}</option>)}
            </select>
            <select value={op} onChange={e=>setOp(e.target.value)}
              className="input-base text-xs py-2 flex-1">
              {OPS.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {!['is empty','is not empty'].includes(op) && (
            <input value={val} onChange={e=>setVal(e.target.value)}
              placeholder="Value…" className="input-base text-xs py-2" />
          )}

          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] mb-1" style={{ color:'#475569' }}>Text color</p>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color:'#475569' }}>Cell background</p>
              <input type="color" value={bg.startsWith('rgba') ? '#1a1a3a' : bg}
                onChange={e=>setBg(e.target.value+'33')}
                className="w-10 h-8 rounded-lg cursor-pointer border-0 bg-transparent" />
            </div>
            <button onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all mt-4"
              style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
              <Plus size={12} /> Add Rule
            </button>
          </div>
        </div>

        {/* Active rules */}
        {store.condRules.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'#334155' }}>Active Rules</p>
            <div className="space-y-1.5">
              {store.condRules.map(r => (
                <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="text-xs flex-1 truncate" style={{ color:'#94A3B8' }}>
                    {store.columns[r.colIdx]?.title} {r.op} {r.val}
                  </span>
                  <button onClick={() => store.removeCondRule(r.id)}
                    className="fmt-btn w-6 h-6"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
