// StatusBar.jsx — Rich status bar with aggregates and Lucide icons
import { useMemo } from 'react'
import { Activity, Columns, Rows } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

const TYPE_COLORS = {text:'#818CF8',number:'#34D399',date:'#FBBF24',boolean:'#F87171',select:'#A78BFA'}

export function StatusBar() {
  const store = useStore()
  const { row, col } = store.selectedCell

  const stats = useMemo(() => {
    const colMeta = store.columns[col]
    if (colMeta?.type !== 'number') return null
    const vals = store.gridData.map(r=>parseFloat(r[col])).filter(v=>!isNaN(v))
    if (!vals.length) return null
    const sum = vals.reduce((a,b)=>a+b,0)
    return {
      sum:  sum.toLocaleString(undefined,{maximumFractionDigits:2}),
      avg:  (sum/vals.length).toLocaleString(undefined,{maximumFractionDigits:2}),
      min:  Math.min(...vals).toLocaleString(),
      max:  Math.max(...vals).toLocaleString(),
      n:    vals.length,
    }
  }, [store.selectedCell, store.gridData, store.columns])

  const nonEmpty = store.gridData.filter(r=>r.some(c=>c!==''&&c!=null)).length
  const colType  = store.columns[col]?.type ?? 'text'
  const color    = TYPE_COLORS[colType] ?? '#818CF8'

  return (
    <div className="status-bar phone-hide">
      <div className="flex items-center gap-1.5">
        <Rows size={10} style={{color:'#1E293B'}}/>
        <span className="text-xs font-mono" style={{color:'#334155'}}>{nonEmpty}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Columns size={10} style={{color:'#1E293B'}}/>
        <span className="text-xs font-mono" style={{color:'#334155'}}>{store.columns.length}</span>
      </div>

      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
        style={{background:`${color}18`,color,border:`1px solid ${color}28`}}>
        {colType}
      </span>

      {stats && (
        <div className="flex items-center gap-3">
          <Activity size={10} style={{color:'#1E293B'}}/>
          {[['∑',stats.sum],['avg',stats.avg],['↓',stats.min],['↑',stats.max],['n',stats.n]].map(([l,v])=>(
            <span key={l} className="text-xs font-mono" style={{color:'#1E293B'}}>
              <span style={{color:'#334155'}}>{l} </span>
              <span style={{color:'#475569',fontWeight:600}}>{v}</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex-1"/>

      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full ${store.isSaving?'bg-amber-400 animate-pulse':'bg-emerald-400'}`}
          style={{boxShadow:store.isSaving?'0 0 5px rgba(251,191,36,.5)':'0 0 5px rgba(52,211,153,.4)'}}/>
        <span className="text-xs" style={{color:'#1E293B'}}>{store.isSaving?'Syncing':'Synced'}</span>
      </div>
    </div>
  )
}
