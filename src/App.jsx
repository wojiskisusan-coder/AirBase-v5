// App.jsx — Main application shell
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Toaster }             from 'react-hot-toast'
import { auth }                from './lib/supabase'
import { useStore }            from './store/spreadsheetStore'
import { useSpreadsheet }      from './hooks/useSpreadsheet'
import { useRealtime }         from './hooks/useRealtime'
import { importCSV }           from './components/Import/importExport'
import { applyTheme, getStoredTheme } from './lib/theme'
import { AuthModal }           from './components/Auth/AuthModal'
import { Toolbar }             from './components/Toolbar/Toolbar'
import { FormattingBar }       from './components/Toolbar/FormattingBar'
import { Sidebar }             from './components/Sidebar/Sidebar'
import { SpreadsheetGrid }     from './components/Grid/SpreadsheetGrid'
import { FormulaBar }          from './components/Grid/FormulaBar'
import { StatusBar }           from './components/Grid/StatusBar'
import { AggregationRow }      from './components/Grid/AggregationRow'
import { AIPanel }             from './components/AI/AIPanel'
import { FilterSortBar }       from './components/Grid/FilterSortBar'
import { RowDetailPanel }      from './components/Grid/RowDetailPanel'
import { DataHealthPanel }     from './components/Grid/DataHealthPanel'
import { ChangeHistoryPanel }  from './components/Grid/ChangeHistoryPanel'
import { GlobalSearch }        from './components/Grid/GlobalSearch'
import { CommentPanel }        from './components/Grid/CommentPanel'
import { MobileNav }           from './components/Grid/MobileNav'
import { Table2, Plus, Database } from 'lucide-react'
import toast from 'react-hot-toast'

export default function App() {
  const store  = useStore()
  const ss     = useSpreadsheet()

  const [authLoading,  setAuthLoading]  = useState(true)
  const [filterOpen,   setFilterOpen]   = useState(false)
  const [filters,      setFilters]      = useState([])
  const [sortConfig,   setSortConfig]   = useState({ colIdx: null, dir: 'asc' })
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [detailRow,    setDetailRow]    = useState(null)
  const [healthOpen,   setHealthOpen]   = useState(false)
  const [historyOpen,  setHistoryOpen]  = useState(false)
  const [commentOpen,  setCommentOpen]  = useState(false)
  // Mobile tab: 'grid' | 'sheets' | 'ai' | 'filter'
  const [mobileTab,    setMobileTab]    = useState('grid')

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    applyTheme(getStoredTheme())

    auth.getUser().then(({ data }) => {
      if (data?.user) {
        store.setUser(data.user)
        ss.loadSheets(data.user.id)
      }
      setAuthLoading(false)
    })

    const { data: sub } = auth.onAuthChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        store.setUser(session.user)
        await ss.loadSheets(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        store.setUser(null)
        store.setSheets([])
      }
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  useRealtime(store.activeSheetId)

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); ss.undo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); ss.redo() }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') { e.preventDefault(); setSearchOpen(true) }
      if (e.altKey && e.key === 'r') { e.preventDefault(); ss.addRow() }
      if (e.altKey && e.key === 'c') { e.preventDefault(); ss.addColumn() }
      if (e.altKey && e.key === 'a') { e.preventDefault(); store.toggleAI() }
      if (e.altKey && e.key === 'f') { e.preventDefault(); setFilterOpen(v => !v) }
      if (e.key === 'Escape') {
        setDetailRow(null); setHealthOpen(false)
        setHistoryOpen(false); setSearchOpen(false); setCommentOpen(false)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [ss.undo, ss.redo])

  // ── CSV import ────────────────────────────────────────
  const handleImport = useCallback(async e => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      toast.loading('Importing…', { id: 'import' })
      const { columns, gridData } = await importCSV(file)
      store.setColumns(columns)
      store.setGridData(gridData)
      store.setDirty(true)
      toast.success(`Imported: ${file.name}`, { id: 'import' })
    } catch (err) {
      toast.error(`Import failed: ${err.message}`, { id: 'import' })
    }
    e.target.value = ''
  }, [])

  // ── Auto-create first sheet ───────────────────────────
  useEffect(() => {
    if (store.user && store.sheets.length === 0 && !authLoading) {
      ss.createSheet('My First Sheet')
    }
  }, [store.user, store.sheets.length, authLoading])

  // ── Mobile tab switching ──────────────────────────────
  useEffect(() => {
    if (mobileTab === 'ai' && !store.aiPanelOpen) store.toggleAI()
    if (mobileTab !== 'ai' && store.aiPanelOpen && window.innerWidth < 768) store.toggleAI()
  }, [mobileTab])

  // ── Filter + sort ─────────────────────────────────────
  const processedData = useMemo(() => {
    let data = store.gridData.map((row, i) => ({ row, _idx: i }))

    filters.forEach(({ colIdx, op, val }) => {
      data = data.filter(({ row }) => {
        const cell = String(row[colIdx] ?? '').toLowerCase()
        const v    = val.toLowerCase()
        if (op === 'contains')      return cell.includes(v)
        if (op === 'equals')        return cell === v
        if (op === '>')             return parseFloat(cell) > parseFloat(v)
        if (op === '<')             return parseFloat(cell) < parseFloat(v)
        if (op === '>=')            return parseFloat(cell) >= parseFloat(v)
        if (op === '<=')            return parseFloat(cell) <= parseFloat(v)
        if (op === 'is empty')      return !cell
        if (op === 'is not empty')  return !!cell
        return true
      })
    })

    if (sortConfig.colIdx !== null) {
      data.sort((a, b) => {
        const av = a.row[sortConfig.colIdx] ?? ''
        const bv = b.row[sortConfig.colIdx] ?? ''
        const an = parseFloat(av), bn = parseFloat(bv)
        const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv))
        return sortConfig.dir === 'asc' ? cmp : -cmp
      })
    }

    return data.map(({ row }) => row)
  }, [store.gridData, filters, sortConfig])

  // ─────────────────────────────────────────────────────
  if (authLoading) return <LoadingScreen />
  if (!store.user)  return <AuthModal />

  const { row, col } = store.selectedCell
  const cellValue    = store.gridData?.[row]?.[col] ?? ''
  const isMobile     = typeof window !== 'undefined' && window.innerWidth < 768

  // On mobile: show only the active tab content
  const showGrid    = !isMobile || mobileTab === 'grid'
  const showSidebar = !isMobile || mobileTab === 'sheets'
  const showAI      = store.aiPanelOpen && (!isMobile || mobileTab === 'ai')
  const showFilter  = !isMobile || mobileTab === 'filter'

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ zIndex: 1 }}>
      <div className="app-bg" />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-strong)',
            fontSize: '12px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-panel)',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'transparent' } },
          error:   { iconTheme: { primary: 'var(--danger)',  secondary: 'transparent' } },
        }}
      />

      {/* Toolbar — always visible */}
      <Toolbar
        onImport={handleImport}
        ss={ss}
        onToggleFilter={() => setFilterOpen(v => !v)}
        filterActive={filterOpen || filters.length > 0}
        onToggleSearch={() => setSearchOpen(true)}
      />

      {/* Formatting bar — always visible */}
      <FormattingBar onComment={() => setCommentOpen(true)} />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden relative" style={{ zIndex: 1 }}>

        {/* Sidebar */}
        {showSidebar && <Sidebar ss={ss} />}

        {/* Center: grid area */}
        {showGrid && (
          <div className="flex flex-col flex-1 overflow-hidden relative">
            {store.activeSheetId ? (
              <>
                {showFilter && (
                  <FilterSortBar
                    visible={filterOpen}
                    filters={filters}
                    onAddFilter={f => setFilters(p => [...p, f])}
                    onRemoveFilter={i => setFilters(p => p.filter((_, j) => j !== i))}
                    sortConfig={sortConfig}
                    onSort={setSortConfig}
                  />
                )}

                <FormulaBar
                  address={`${String.fromCharCode(65 + col)}${row + 1}`}
                  value={cellValue}
                  onChange={val => ss.handleCellChange(row, col, val)}
                />

                <SpreadsheetGrid
                  ss={{ ...ss, gridData: processedData }}
                  onRowDoubleClick={i => setDetailRow(i)}
                />

                <AggregationRow />
                <StatusBar ss={ss} />

                {/* Right-side panels (desktop) */}
                {detailRow !== null && (
                  <RowDetailPanel rowIndex={detailRow} onClose={() => setDetailRow(null)} ss={ss} />
                )}
                {healthOpen  && <DataHealthPanel   onClose={() => setHealthOpen(false)} />}
                {historyOpen && <ChangeHistoryPanel onClose={() => setHistoryOpen(false)} />}

                {/* Bulk select bar */}
                {store.selectedRows?.size > 0 && (
                  <div className="bulk-bar">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {store.selectedRows.size} selected
                    </span>
                    <button className="toolbar-btn danger text-xs" onClick={ss.deleteSelectedRows}>Delete</button>
                    <button className="toolbar-btn text-xs" onClick={store.clearRowSelect}>Clear</button>
                  </div>
                )}

                {/* Keyboard hints — desktop only */}
                <div className="absolute bottom-8 left-4 hidden xl:flex gap-3 pointer-events-none">
                  {[['Ctrl+Z','Undo'],['Ctrl+F','Search'],['Alt+R','Row'],['Alt+A','AI']].map(([k,l]) => (
                    <div key={k} className="flex items-center gap-1">
                      <span className="kbd">{k}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{l}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState onCreateSheet={() => ss.createSheet('New Sheet')} />
            )}
          </div>
        )}

        {/* AI Panel */}
        {showAI && (
          <div className={isMobile ? 'fixed inset-0 z-50 flex flex-col' : ''}>
            {isMobile && (
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => { store.toggleAI(); setMobileTab('grid') }}
              />
            )}
            <div className={isMobile ? 'relative ml-auto h-full w-full max-w-sm' : ''}>
              <AIPanel ss={ss} />
            </div>
          </div>
        )}
      </div>

      {/* Global search overlay */}
      {searchOpen && (
        <GlobalSearch
          onClose={() => setSearchOpen(false)}
          onJump={(r, c) => store.setSelectedCell(r, c)}
        />
      )}

      {/* Comment modal */}
      {commentOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setCommentOpen(false)} />
          <CommentPanel onClose={() => setCommentOpen(false)} />
        </>
      )}

      {/* Mobile bottom nav */}
      <MobileNav activeTab={mobileTab} setActiveTab={setMobileTab} />
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full" style={{ background: 'var(--bg-base)' }}>
      <div className="app-bg" />
      <div className="text-center relative z-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg,var(--accent-dark),#7C3AED)', boxShadow: '0 8px 40px rgba(79,70,229,0.45)' }}
        >
          <Database size={28} color="white" />
        </div>
        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AirBase</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        <div className="flex justify-center gap-1.5 mt-5">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)', animation: `floatDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreateSheet }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 relative z-10">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.12)' }}>
        <Table2 size={36} color="rgba(99,102,241,0.4)" />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No sheet open</h2>
      <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--text-muted)' }}>
        Create a sheet or ask the AI to generate a table for you.
      </p>
      <button
        onClick={onCreateSheet}
        className="px-8 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:scale-105"
        style={{ background: 'linear-gradient(135deg,var(--accent-dark),#7C3AED)', boxShadow: '0 4px 24px rgba(79,70,229,0.4)' }}
      >
        <Plus size={15} /> Create Sheet
      </button>
    </div>
  )
}
