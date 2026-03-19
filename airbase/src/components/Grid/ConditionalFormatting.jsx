// ConditionalFormatting.jsx — Rule manager panel
import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'

const OPS    = ['equals','contains','>','<','>=','<=','is empty','is not empty']
const COLORS = [
  {label:'Red',    cls:'cf-highlight-red'},
  {label:'Green',  cls:'cf-highlight-green'},
  {label:'Amber',  cls:'cf-highlight-amber'},
  {label:'Blue',   cls:'cf-highlight-blue'},
  {label:'Purple', cls:'cf-highlight-purple'},
]

export function ConditionalFormattingPanel({ columns, rules, onAdd, onRemove, onClose }) {
  const [colIdx, setColIdx] = useState(0)
  const [op,     setOp]     = useState('equals')
  const [value,  setValue]  = useState('')
  const [color,  setColor]  = useState(COLORS[0].cls)

  const handleAdd = () => {
    if (colIdx === '' && !['is empty','is not empty'].includes(op)) return
    onAdd({ colIdx:Number(colIdx), op, value, colorCls:color })
    setValue('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)'}}>
      <div className="w-full max-w-lg glass-lg rounded-2xl overflow-hidden anim-scale">
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(255,255,255,.07)'}}>
          <h2 className="font-bold text-white text-sm">Conditional Formatting</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15}/></button>
        </div>

        {/* Rule builder */}
        <div className="p-5" style={{borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <p className="text-xs font-semibold mb-3" style={{color:'#475569'}}>ADD RULE</p>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="input text-xs py-1.5" style={{width:'auto'}} value={colIdx} onChange={e=>setColIdx(e.target.value)}>
              {columns.map((c,i)=><option key={i} value={i}>{c.title}</option>)}
            </select>
            <select className="input text-xs py-1.5" style={{width:'auto'}} value={op} onChange={e=>setOp(e.target.value)}>
              {OPS.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
            {!['is empty','is not empty'].includes(op) && (
              <input className="input text-xs py-1.5" style={{width:100}} placeholder="Value" value={value} onChange={e=>setValue(e.target.value)}/>
            )}
            <div className="flex gap-1.5">
              {COLORS.map(c=>(
                <button key={c.cls} title={c.label}
                  className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${color===c.cls?'ring-2 ring-white ring-offset-1 ring-offset-transparent':''}`}
                  style={{background:c.cls.includes('red')?'#F87171':c.cls.includes('green')?'#34D399':c.cls.includes('amber')?'#FBBF24':c.cls.includes('blue')?'#60A5FA':'#A78BFA'}}
                  onClick={()=>setColor(c.cls)}/>
              ))}
            </div>
            <button className="btn btn-primary text-xs py-1.5" onClick={handleAdd}>
              <Plus size={12}/>Add Rule
            </button>
          </div>
        </div>

        {/* Existing rules */}
        <div className="p-5 space-y-2 max-h-60 overflow-y-auto">
          {rules.length === 0 && (
            <p className="text-xs text-center py-4" style={{color:'#334155'}}>No rules yet. Add one above.</p>
          )}
          {rules.map((rule, i) => (
            <div key={rule.id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)'}}>
              <div className={`w-2.5 h-2.5 rounded-full`}
                style={{background:rule.colorCls?.includes('red')?'#F87171':rule.colorCls?.includes('green')?'#34D399':rule.colorCls?.includes('amber')?'#FBBF24':rule.colorCls?.includes('blue')?'#60A5FA':'#A78BFA'}}/>
              <span className="text-xs flex-1" style={{color:'#94A3B8'}}>
                <span style={{color:'#CBD5E1'}}>{columns[rule.colIdx]?.title}</span>
                {' '}{rule.op}{' '}
                {rule.value && <span style={{color:'#818CF8'}}>"{rule.value}"</span>}
              </span>
              <button className="btn btn-ghost btn-icon" onClick={()=>onRemove(rule.id)} style={{width:24,height:24}}>
                <Trash2 size={11}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
