// FilterSortBar.jsx — Lucide icons, animated chips
import { Plus, X, SortAsc, SortDesc } from 'lucide-react'
import { useState } from 'react'
import { useStore } from '../../store/spreadsheetStore'

export function FilterSortBar({ visible, filters, onAddFilter, onRemoveFilter, sortConfig, onSort }) {
  const store = useStore()
  const [col, setCol] = useState('')
  const [op,  setOp]  = useState('contains')
  const [val, setVal] = useState('')
  const OPS = ['contains','equals','>','<','>=','<=','is empty','is not empty']

  if (!visible) return null

  const add = () => {
    if (col===''||(!val&&!['is empty','is not empty'].includes(op))) return
    onAddFilter({colIdx:Number(col),op,val})
    setVal('')
  }

  const selStyle = {background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.07)',
    color:'#94A3B8',fontSize:12,padding:'5px 8px',borderRadius:8,outline:'none'}

  return (
    <div className="filter-bar">
      <div className="flex items-center gap-2 flex-wrap w-full">
        <span className="text-xs font-semibold shrink-0" style={{color:'#334155'}}>Filter</span>

        <select style={selStyle} value={col} onChange={e=>setCol(e.target.value)}>
          <option value="">Column…</option>
          {store.columns.map((c,i)=><option key={i} value={i}>{c.title}</option>)}
        </select>

        <select style={selStyle} value={op} onChange={e=>setOp(e.target.value)}>
          {OPS.map(o=><option key={o} value={o}>{o}</option>)}
        </select>

        {!['is empty','is not empty'].includes(op) && (
          <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
            placeholder="Value…" style={{...selStyle,width:100}}/>
        )}

        <button className="btn btn-ghost text-xs py-1.5" onClick={add}>
          <Plus size={11}/>Add
        </button>

        <div style={{width:1,height:18,background:'rgba(255,255,255,.06)',margin:'0 4px'}}/>

        <span className="text-xs font-semibold shrink-0" style={{color:'#334155'}}>Sort</span>
        <select style={selStyle} value={sortConfig.colIdx??''} onChange={e=>onSort({...sortConfig,colIdx:e.target.value===''?null:Number(e.target.value)})}>
          <option value="">Column…</option>
          {store.columns.map((c,i)=><option key={i} value={i}>{c.title}</option>)}
        </select>

        <button className="btn btn-ghost btn-icon" onClick={()=>onSort({...sortConfig,dir:sortConfig.dir==='asc'?'desc':'asc'})}>
          {sortConfig.dir==='asc'?<SortAsc size={13}/>:<SortDesc size={13}/>}
        </button>

        {filters.length>0 && (
          <>
            <div style={{width:1,height:18,background:'rgba(255,255,255,.06)',margin:'0 4px'}}/>
            {filters.map((f,i)=>(
              <span key={i} className="filter-chip">
                <span style={{color:'#818CF8'}}>{store.columns[f.colIdx]?.title}</span>
                <span style={{opacity:.6}}> {f.op}</span>
                {f.val&&<span style={{color:'#34D399'}}> "{f.val}"</span>}
                <button onClick={()=>onRemoveFilter(i)} className="ml-1 transition-opacity hover:opacity-100" style={{opacity:.5}}>
                  <X size={9}/>
                </button>
              </span>
            ))}
            <button className="text-xs btn btn-ghost py-1" onClick={()=>filters.forEach((_,i)=>onRemoveFilter(0))}>
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  )
}
