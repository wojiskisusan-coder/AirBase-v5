// SearchOverlay.jsx — Cmd+F global search with jump-to-cell
import { useState, useEffect, useRef } from 'react'
import { Search, X, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'
import { colIndexToLetter } from '../../lib/hyperformula'

export function SearchOverlay({ onClose, onJump }) {
  const store   = useStore()
  const [query, setQuery]   = useState('')
  const [idx,   setIdx]     = useState(0)
  const inputRef            = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Find all matching cells
  const results = []
  if (query.trim()) {
    const q = query.toLowerCase()
    store.gridData.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (String(cell??'').toLowerCase().includes(q)) {
          results.push({ row:ri, col:ci, value:String(cell), colName:store.columns[ci]?.title })
        }
      })
    })
  }

  const current = results[idx] ?? null

  useEffect(() => {
    if (current) {
      store.setSelectedCell(current.row, current.col)
      onJump?.(current.row, current.col)
    }
  }, [idx, current])

  const nav = (dir) => {
    if (!results.length) return
    setIdx(i => (i + dir + results.length) % results.length)
  }

  const highlight = (text, q) => {
    if (!q) return text
    const i = text.toLowerCase().indexOf(q.toLowerCase())
    if (i === -1) return text
    return (
      <>
        {text.slice(0,i)}
        <mark className="rounded px-0.5" style={{background:'rgba(99,102,241,.35)',color:'#C7D2FE'}}>{text.slice(i,i+q.length)}</mark>
        {text.slice(i+q.length)}
      </>
    )
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={e=>e.stopPropagation()}>

        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3" style={{borderBottom:'1px solid rgba(255,255,255,.07)'}}>
          <Search size={16} className="shrink-0" style={{color:'#475569'}}/>
          <input ref={inputRef} value={query} onChange={e=>{setQuery(e.target.value);setIdx(0)}}
            placeholder="Search all cells…"
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-slate-600"
            onKeyDown={e=>{
              if(e.key==='Enter') nav(e.shiftKey?-1:1)
              if(e.key==='Escape') onClose()
              if(e.key==='ArrowDown'){e.preventDefault();nav(1)}
              if(e.key==='ArrowUp'){e.preventDefault();nav(-1)}
            }}
          />
          {results.length > 0 && (
            <span className="text-xs shrink-0" style={{color:'#475569'}}>
              {idx+1}/{results.length}
            </span>
          )}
          <div className="flex gap-1">
            <button className="btn btn-ghost btn-icon" onClick={()=>nav(-1)} disabled={!results.length}><ArrowUp size={13}/></button>
            <button className="btn btn-ghost btn-icon" onClick={()=>nav(1)}  disabled={!results.length}><ArrowDown size={13}/></button>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14}/></button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{color:'#334155'}}>
              No matches found for "{query}"
            </div>
          )}
          {results.slice(0,40).map((r,i) => (
            <div key={i}
              className={`search-result ${i===idx?'active':''}`}
              onClick={()=>{setIdx(i);store.setSelectedCell(r.row,r.col);onClose()}}>
              <div className="w-14 shrink-0">
                <span className="badge badge-indigo font-mono text-[10px]">
                  {colIndexToLetter(r.col)}{r.row+1}
                </span>
              </div>
              <div className="text-xs font-medium shrink-0 w-20 truncate" style={{color:'#475569'}}>{r.colName}</div>
              <div className="text-sm truncate" style={{color:'#CBD5E1'}}>
                {highlight(r.value, query)}
              </div>
              <ChevronRight size={12} className="ml-auto shrink-0" style={{color:'#334155'}}/>
            </div>
          ))}
          {results.length > 40 && (
            <div className="px-4 py-2 text-xs text-center" style={{color:'#334155'}}>
              +{results.length-40} more matches
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-3 px-4 py-2" style={{borderTop:'1px solid rgba(255,255,255,.05)'}}>
          {[['Enter','Next'],['Shift+Enter','Prev'],['Esc','Close']].map(([k,l])=>(
            <span key={k} className="flex items-center gap-1.5 text-xs" style={{color:'#1E293B'}}>
              <span className="kbd">{k}</span><span>{l}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
