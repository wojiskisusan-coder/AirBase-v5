// AggregationRow.jsx — UNIQUE: pinned live aggregation row above status bar
import { useMemo } from 'react'
import { useStore } from '../../store/spreadsheetStore'

export function AggregationRow() {
  const store = useStore()

  const aggs = useMemo(()=>{
    return store.columns.map((col,ci)=>{
      if(col.type!=='number') return null
      const vals = store.gridData.map(r=>parseFloat(r[ci])).filter(v=>!isNaN(v))
      if(!vals.length) return null
      const sum = vals.reduce((a,b)=>a+b,0)
      return { sum: sum.toLocaleString(undefined,{maximumFractionDigits:1}), count: vals.length }
    })
  },[store.gridData,store.columns])

  const hasAny = aggs.some(Boolean)
  if(!hasAny) return null

  return(
    <div className="flex items-center shrink-0 overflow-hidden phone-hide"
      style={{height:24,background:'rgba(8,8,18,0.9)',borderTop:'1px solid rgba(99,102,241,0.1)'}}>
      {/* Row header spacer */}
      <div className="shrink-0" style={{width:50,borderRight:'1px solid rgba(255,255,255,0.04)'}}/>
      <div className="flex flex-1 overflow-hidden">
        {aggs.map((agg,i)=>(
          <div key={i} className="shrink-0 flex items-center justify-end px-2 text-[10px] font-mono"
            style={{width:store.columns[i]?.width||120,borderRight:'1px solid rgba(255,255,255,0.03)'}}>
            {agg?(
              <span style={{color:'rgba(99,102,241,0.7)'}}>Σ {agg.sum}</span>
            ):null}
          </div>
        ))}
      </div>
    </div>
  )
}
