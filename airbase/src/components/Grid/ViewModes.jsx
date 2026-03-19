// ViewModes.jsx — Cards view and Summary view for the same data
import { useStore } from '../../store/spreadsheetStore'

const TYPE_COLOR = { text:'#818CF8', number:'#34D399', date:'#FBBF24', boolean:'#F87171', select:'#A78BFA' }

// ── Cards View ────────────────────────────────────────────
export function CardsView({ data, onRowClick }) {
  const store = useStore()
  const visibleCols = store.columns.filter((_, i) => !store.hiddenCols.has(i))
  const titleCol = visibleCols[0]
  const restCols = visibleCols.slice(1, 5)

  const nonEmpty = data.filter(row => row.some(c => c !== '' && c != null))

  if (nonEmpty.length === 0) return <EmptyCards />

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))' }}>
        {nonEmpty.map((row, i) => {
          const title = row[store.columns.indexOf(titleCol)] || `Row ${i+1}`
          return (
            <div key={i} className="data-card animate-fade-up" style={{ animationDelay:`${i*20}ms` }}
              onClick={() => onRowClick?.(i)}>
              <div className="text-sm font-semibold text-white truncate mb-3">{title}</div>
              <div className="space-y-2">
                {restCols.map(col => {
                  const ci  = store.columns.indexOf(col)
                  const val = row[ci]
                  if (!val) return null
                  return (
                    <div key={col.key} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] truncate" style={{ color:'#475569' }}>{col.title}</span>
                      <span className="text-[11px] font-medium truncate max-w-[120px]" style={{ color: TYPE_COLOR[col.type] || '#94A3B8' }}>
                        {col.type === 'boolean' ? (val === 'true' ? '✓ Yes' : '✗ No') : val}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Summary View ─────────────────────────────────────────
export function SummaryView({ data }) {
  const store = useStore()
  const nonEmpty = data.filter(r => r.some(c => c !== '' && c != null))

  const stats = store.columns.map((col, ci) => {
    const vals = nonEmpty.map(r => r[ci]).filter(v => v !== '' && v != null)
    const numVals = vals.map(v => parseFloat(v)).filter(v => !isNaN(v))
    const isNum  = numVals.length > vals.length * 0.5

    if (isNum && numVals.length > 0) {
      const sum = numVals.reduce((a,b) => a+b, 0)
      return {
        col, type:'numeric',
        sum: sum.toLocaleString(undefined,{maximumFractionDigits:2}),
        avg: (sum/numVals.length).toLocaleString(undefined,{maximumFractionDigits:2}),
        min: Math.min(...numVals).toLocaleString(),
        max: Math.max(...numVals).toLocaleString(),
        count: numVals.length,
      }
    }
    // Categorical
    const freq = {}
    vals.forEach(v => { freq[v] = (freq[v]||0)+1 })
    const sorted = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5)
    return { col, type:'categorical', top: sorted, total: vals.length, unique: Object.keys(freq).length }
  })

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid gap-4" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))' }}>
        {stats.map((s, i) => (
          <div key={i} className="summary-stat animate-fade-up" style={{ animationDelay:`${i*25}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold truncate text-white">{s.col.title}</span>
              <span className="badge" style={{
                background:`${TYPE_COLOR[s.col.type] || '#818CF8'}18`,
                color: TYPE_COLOR[s.col.type] || '#818CF8',
                border:`1px solid ${TYPE_COLOR[s.col.type] || '#818CF8'}30`,
                fontSize:'9px', padding:'1px 6px',
              }}>{s.col.type}</span>
            </div>

            {s.type === 'numeric' ? (
              <div className="space-y-1.5">
                {[['Sum',s.sum],['Avg',s.avg],['Min',s.min],['Max',s.max],['Count',s.count]].map(([l,v])=>(
                  <div key={l} className="flex justify-between">
                    <span className="text-xs" style={{ color:'#334155' }}>{l}</span>
                    <span className="text-xs font-semibold font-mono" style={{ color:'#94A3B8' }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color:'#334155' }}>Unique values</span>
                  <span className="font-semibold font-mono" style={{ color:'#94A3B8' }}>{s.unique}</span>
                </div>
                {s.top.map(([val,cnt])=>(
                  <div key={val} className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{
                        width:`${(cnt/s.total)*100}%`,
                        background:'linear-gradient(90deg,#4F46E5,#7C3AED)',
                      }} />
                    </div>
                    <span className="text-[10px] truncate max-w-[70px]" style={{ color:'#94A3B8' }}>{val||'(empty)'}</span>
                    <span className="text-[10px] font-mono shrink-0" style={{ color:'#475569' }}>{cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyCards() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm" style={{ color:'#334155' }}>No data to display as cards</p>
    </div>
  )
}
