// GlobalSearch.jsx — Cmd+F overlay with jump-to-cell
import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'
import { colIndexToLetter } from '../../lib/hyperformula'

export function GlobalSearch({ onClose, onJumpTo }) {
  const store   = useStore()
  const [query, setQuery]   = useState('')
  const [idx,   setIdx]     = useState(0)
  const inputRef = useRef(null)

  // Find all matching cells
  const results = []
  if (query.trim()) {
    const q = query.toLowerCase()
    store.gridData.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (String(cell ?? '').toLowerCase().includes(q)) {
          results.push({ r, c, value: String(cell) })
        }
      })
    })
  }

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (results.length > 0) {
      const cur = results[idx % results.length]
      onJumpTo?.(cur.r, cur.c)
      store.setSelectedCell(cur.r, cur.c)
    }
  }, [idx, query])

  const next = () => setIdx(i => (i + 1) % Math.max(results.length, 1))
  const prev = () => setIdx(i => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1))

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Enter')  next()
    if (e.key === 'ArrowDown') { e.preventDefault(); next() }
    if (e.key === 'ArrowUp')   { e.preventDefault(); prev() }
  }

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-box" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <Search size={18} style={{ color:'#6366F1' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setIdx(0) }}
            onKeyDown={handleKey}
            placeholder="Search across all cells…"
            className="flex-1 bg-transparent outline-none text-base text-white placeholder-slate-600"
          />
          {query && (
            <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background:'rgba(99,102,241,0.15)', color:'#818CF8' }}>
              {results.length > 0 ? `${(idx % results.length) + 1} / ${results.length}` : '0 results'}
            </span>
          )}
          <div className="flex items-center gap-1">
            <button className="fmt-btn" onClick={prev} title="Previous (↑)"><ChevronUp size={14} /></button>
            <button className="fmt-btn" onClick={next} title="Next (↓)"><ChevronDown size={14} /></button>
            <button className="fmt-btn" onClick={onClose} title="Close (Esc)"><X size={14} /></button>
          </div>
        </div>

        {/* Results list */}
        {query.trim() && (
          <div className="max-h-72 overflow-y-auto">
            {results.length === 0 ? (
              <div className="py-8 text-center text-sm" style={{ color:'#334155' }}>No matches found</div>
            ) : (
              results.slice(0, 30).map((res, i) => {
                const col   = store.columns[res.c]
                const isActive = i === idx % results.length
                const addr  = `${colIndexToLetter(res.c)}${res.r + 1}`
                const hi    = res.value.replace(new RegExp(`(${query})`, 'gi'), '<mark style="background:rgba(99,102,241,0.35);color:#A5B4FC;border-radius:3px;padding:0 2px">$1</mark>')
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-all"
                    style={{
                      background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                      borderLeft: isActive ? '2px solid #6366F1' : '2px solid transparent',
                    }}
                    onClick={() => { setIdx(i); onClose() }}
                  >
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md shrink-0"
                      style={{ background:'rgba(99,102,241,0.15)', color:'#818CF8' }}>{addr}</span>
                    <span className="text-xs shrink-0" style={{ color:'#475569' }}>{col?.title}</span>
                    <span className="text-sm truncate flex-1" style={{ color:'#CBD5E1' }}
                      dangerouslySetInnerHTML={{ __html: hi }} />
                  </div>
                )
              })
            )}
            {results.length > 30 && (
              <div className="py-3 text-center text-xs" style={{ color:'#334155' }}>
                Showing 30 of {results.length} results
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-2.5" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
          {[['↑↓','Navigate'],['Enter','Next'],['Esc','Close']].map(([k,l]) => (
            <span key={k} className="flex items-center gap-1.5 text-[11px]" style={{ color:'#334155' }}>
              <span className="kbd">{k}</span>{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
