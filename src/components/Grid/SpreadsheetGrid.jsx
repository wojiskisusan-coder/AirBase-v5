// SpreadsheetGrid.jsx — Lazy loads Handsontable, handles timeout properly
import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '../../store/spreadsheetStore'

function GridSkeleton() {
  const store = useStore()
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
  return (
    <div className="flex-1 overflow-hidden p-1.5" style={{ background: 'var(--bg-base)' }}>
      <div className="flex gap-0.5 mb-0.5">
        <div className="w-10 h-8 shrink-0 skeleton" />
        {Array(9).fill(0).map((_, i) => (
          <div key={i} className="h-8 flex-1 skeleton" style={{ minWidth: 80 }} />
        ))}
      </div>
      {Array(16).fill(0).map((_, r) => (
        <div key={r} className="flex gap-0.5 mb-0.5">
          <div className="w-10 h-9 shrink-0 skeleton" />
          {Array(9).fill(0).map((_, c) => (
            <div key={c} className="h-9 flex-1 skeleton"
              style={{ minWidth: 80, animationDelay: `${(r * 9 + c) * 12}ms` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

const TYPE_MAP = { text: 'text', number: 'numeric', date: 'date', boolean: 'checkbox', select: 'dropdown' }

export function SpreadsheetGrid({ ss, onRowDoubleClick }) {
  const containerRef = useRef(null)
  const hotRef       = useRef(null)
  const hfRef        = useRef(null)
  const store        = useStore()
  const [ready,  setReady]  = useState(false)
  const [error,  setError]  = useState(null)
  const [loadPct,setLoadPct]= useState(0)

  const buildColSettings = useCallback((columns) =>
    columns.map(col => ({
      title:      col.title,
      type:       TYPE_MAP[col.type] || 'text',
      width:      col.width || 120,
      source:     col.type === 'select' ? (col.options || []) : undefined,
      dateFormat: col.type === 'date' ? 'YYYY-MM-DD' : undefined,
    })), [])

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    // Fake progress to show user something is happening
    const tick = setInterval(() => setLoadPct(p => Math.min(p + 15, 85)), 200)

    Promise.all([
      import('handsontable'),
      import('hyperformula'),
    ]).then(([{ default: Handsontable }, { HyperFormula }]) => {
      clearInterval(tick)
      setLoadPct(100)
      if (destroyed || !containerRef.current) return

      try {
        hfRef.current = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
        hotRef.current = new Handsontable(containerRef.current, {
          data:               store.gridData,
          colHeaders:         store.columns.map(c => c.title),
          rowHeaders:         true,
          columns:            buildColSettings(store.columns),
          formulas:           { engine: hfRef.current },
          contextMenu: {
            items: {
              row_above: { name: 'Insert row above' },
              row_below: { name: 'Insert row below' },
              remove_row:{ name: 'Delete row', callback: (_, sel) => ss.removeRow(sel[0].start.row) },
              sep1: '---------',
              col_left:  { name: 'Insert col left' },
              col_right: { name: 'Insert col right' },
              remove_col:{ name: 'Delete column', callback: (_, sel) => ss.removeColumn(sel[0].start.col) },
              sep2: '---------',
              duplicate: { name: 'Duplicate row', callback: (_, sel) => ss.duplicateRow?.(sel[0].start.row) },
              sep3: '---------',
              copy: { name: 'Copy' },
              cut:  { name: 'Cut'  },
            },
          },
          manualColumnResize: true,
          manualRowResize:    true,
          stretchH:           'all',
          height:             '100%',
          width:              '100%',
          licenseKey:         'non-commercial-and-evaluation',
          afterChange: (changes) => {
            if (!changes) return
            changes.forEach(([r, c, , v]) => ss.handleCellChange(r, c, v))
          },
          afterSelection:    (r, c) => ss.setSelectedCell(r, c),
          afterDblClick:     (_, coords) => onRowDoubleClick?.(coords.row),
          afterColumnResize: (col, width) => ss.updateColumn(col, { width }),
        })
        setReady(true)
      } catch (e) {
        setError(e.message)
      }
    }).catch(e => {
      clearInterval(tick)
      setError(`Failed to load grid: ${e.message}`)
    })

    return () => {
      destroyed = true
      clearInterval(tick)
      try { hotRef.current?.destroy() } catch {}
      try { hfRef.current?.destroy()  } catch {}
    }
  }, [])

  // Sync data after init
  useEffect(() => {
    const hot = hotRef.current
    if (!hot || !ready) return
    try {
      hot.updateSettings({
        colHeaders: store.columns.map(c => c.title),
        columns:    buildColSettings(store.columns),
      })
      hot.loadData(ss.gridData || store.gridData)
    } catch {}
  }, [store.columns, ss.gridData, ready])

  if (error) return (
    <div className="flex-1 flex items-center justify-center flex-col gap-3 p-8 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <span style={{ color: 'var(--danger)', fontSize: 22 }}>!</span>
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Grid failed to load</p>
      <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>{error}</p>
      <button onClick={() => window.location.reload()}
        className="toolbar-btn primary mt-2">Reload app</button>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col" style={{ background: 'var(--bg-base)' }}>
          <GridSkeleton />
          {/* Loading progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--bg-hover)' }}>
            <div className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${loadPct}%`, background: 'linear-gradient(90deg, var(--accent-dark), var(--accent-light))' }} />
          </div>
        </div>
      )}
      <div ref={containerRef} className="flex-1 overflow-hidden"
        style={{ visibility: ready ? 'visible' : 'hidden' }} />
    </div>
  )
}
