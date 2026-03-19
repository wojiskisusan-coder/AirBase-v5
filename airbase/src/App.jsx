// App.jsx — Master orchestrator v3
import { useEffect, useState, useCallback, useMemo } from 'react'
import { Toaster }    from 'react-hot-toast'
import toast          from 'react-hot-toast'
import { auth }       from './lib/supabase'
import { useStore }   from './store/spreadsheetStore'
import { useSpreadsheet }  from './hooks/useSpreadsheet'
import { useRealtime }     from './hooks/useRealtime'
import { importCSV }       from './components/Import/importExport'
import { AuthModal }       from './components/Auth/AuthModal'
import { Toolbar }         from './components/Toolbar/Toolbar'
import { FormattingBar }   from './components/Toolbar/FormattingBar'
import { Sidebar }         from './components/Sidebar/Sidebar'
import { SpreadsheetGrid } from './components/Grid/SpreadsheetGrid'
import { StatusBar }       from './components/Grid/StatusBar'
import { AIPanel }         from './components/AI/AIPanel'
import { FilterSortBar }   from './components/Grid/FilterSortBar'
import { RowDetailPanel }  from './components/Grid/RowDetailPanel'
import { MobileNav }       from './components/Grid/MobileNav'
import { SearchOverlay }   from './components/Grid/SearchOverlay'
import { KeyboardShortcutsModal } from './components/Grid/KeyboardShortcutsModal'
import { ConditionalFormattingPanel } from './components/Grid/ConditionalFormatting'
import { Table2, Layers, Bot } from 'lucide-react'

export default function App() {
  const store = useStore()
  const ss    = useSpreadsheet()

  const [authLoading, setAuthLoading] = useState(true)
  const [filterOpen,  setFilterOpen]  = useState(false)
  const [filters,     setFilters]     = useState([])
  const [sortConfig,  setSortConfig]  = useState({ colIdx:null, dir:'asc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [detailRow,   setDetailRow]   = useState(null)
  const [mobileTab,   setMobileTab]   = useState('grid')
  const [cfOpen,      setCfOpen]      = useState(false)

  // ── Auth ──────────────────────────────────────────────
  useEffect(() => {
    auth.getUser().then(({data})=>{
      if (data?.user) { store.setUser(data.user); ss.loadSheets(data.user.id) }
      setAuthLoading(false)
    })
    const {data:sub} = auth.onAuthChange(async (event,session)=>{
      if (event==='SIGNED_IN'&&session?.user) { store.setUser(session.user); await ss.loadSheets(session.user.id) }
      else if (event==='SIGNED_OUT') { store.setUser(null); store.setSheets([]) }
    })
    return ()=>sub?.subscription?.unsubscribe()
  }, [])

  useRealtime(store.activeSheetId)

  // ── Keyboard shortcuts ────────────────────────────────
  useEffect(()=>{
    const h = (e) => {
      const ctrl = e.ctrlKey||e.metaKey
      if (ctrl&&e.key==='z'&&!e.shiftKey) { e.preventDefault(); ss.undo() }
      if (ctrl&&(e.key==='y'||(e.key==='z'&&e.shiftKey))) { e.preventDefault(); ss.redo() }
      if (ctrl&&e.key==='f') { e.preventDefault(); store.setSearchOpen(true) }
      if (ctrl&&e.key==='b') { const {row,col}=store.selectedCell; ss.updateCellFormat(row,col,{bold:!store.cellFormats[`${row}_${col}`]?.bold}) }
      if (ctrl&&e.key==='i') { const {row,col}=store.selectedCell; ss.updateCellFormat(row,col,{italic:!store.cellFormats[`${row}_${col}`]?.italic}) }
      if (ctrl&&e.key==='u') { e.preventDefault(); const {row,col}=store.selectedCell; ss.updateCellFormat(row,col,{underline:!store.cellFormats[`${row}_${col}`]?.underline}) }
      if (e.altKey&&e.key==='r') { e.preventDefault(); ss.addRow() }
      if (e.altKey&&e.key==='c') { e.preventDefault(); ss.addColumn() }
      if (e.altKey&&e.key==='a') { e.preventDefault(); store.toggleAI() }
      if (e.altKey&&e.key==='f') { e.preventDefault(); setFilterOpen(v=>!v) }
      if (e.key==='Escape') { setDetailRow(null); store.setSearchOpen(false) }
    }
    window.addEventListener('keydown',h)
    return ()=>window.removeEventListener('keydown',h)
  }, [store.selectedCell, store.cellFormats])

  // ── CSV Import ────────────────────────────────────────
  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      toast.loading('Importing…', {id:'imp'})
      const {columns,gridData} = await importCSV(file)
      store.setColumns(columns); store.setGridData(gridData); store.setDirty(true)
      toast.success(`Imported: ${file.name}`, {id:'imp'})
    } catch(err) { toast.error(err.message, {id:'imp'}) }
    e.target.value=''
  }, [])

  // Auto-create first sheet
  useEffect(()=>{
    if (store.user&&store.sheets.length===0&&!authLoading) ss.createSheet('My First Sheet')
  }, [store.user,store.sheets.length,authLoading])

  // ── Filter + Sort + Search pipeline ──────────────────
  const processedData = useMemo(()=>{
    let data = store.gridData.map((row,i)=>({row,_i:i}))
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      data = data.filter(({row})=>row.some(c=>String(c??'').toLowerCase().includes(q)))
    }
    filters.forEach(({colIdx,op,val})=>{
      data = data.filter(({row})=>{
        const c=String(row[colIdx]??'').toLowerCase(), v=(val??'').toLowerCase()
        if (op==='contains')     return c.includes(v)
        if (op==='equals')       return c===v
        if (op==='>')            return parseFloat(c)>parseFloat(v)
        if (op==='<')            return parseFloat(c)<parseFloat(v)
        if (op==='>=')           return parseFloat(c)>=parseFloat(v)
        if (op==='<=')           return parseFloat(c)<=parseFloat(v)
        if (op==='is empty')     return !c
        if (op==='is not empty') return !!c
        return true
      })
    })
    if (sortConfig.colIdx!==null) {
      data.sort((a,b)=>{
        const av=a.row[sortConfig.colIdx]??'', bv=b.row[sortConfig.colIdx]??''
        const an=parseFloat(av), bn=parseFloat(bv)
        const cmp=!isNaN(an)&&!isNaN(bn)?an-bn:String(av).localeCompare(String(bv))
        return sortConfig.dir==='asc'?cmp:-cmp
      })
    }
    return data.map(({row})=>row)
  }, [store.gridData,searchQuery,filters,sortConfig])

  // Handle NL filter from AI
  const handleApplyFilter = useCallback((newFilters)=>{
    setFilters(prev=>[...prev,...newFilters])
    setFilterOpen(true)
  }, [])

  if (authLoading) return <LoadingScreen/>
  if (!store.user)  return <AuthModal/>

  const hasSheet = !!store.activeSheetId

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{zIndex:1}}>
      <div className="app-bg"/>

      <Toaster position="bottom-right" toastOptions={{
        style:{background:'rgba(14,14,30,.97)',color:'#E2E8F0',border:'1px solid rgba(99,102,241,.25)',
          fontSize:13,borderRadius:14,backdropFilter:'blur(24px)',boxShadow:'0 12px 40px rgba(0,0,0,.6)'},
        success:{iconTheme:{primary:'#34D399',secondary:'#080812'}},
        error:  {iconTheme:{primary:'#F87171',secondary:'#080812'}},
      }}/>

      <Toolbar onImport={handleImport} ss={ss}
        onSearch={setSearchQuery} onToggleFilter={()=>setFilterOpen(v=>!v)}
        filterActive={filterOpen||filters.length>0}/>

      {hasSheet && <FormattingBar ss={ss}/>}

      <div className="flex flex-1 overflow-hidden relative" style={{zIndex:1}}>
        <Sidebar ss={ss}/>

        <div className="flex flex-col flex-1 overflow-hidden relative">
          {hasSheet ? (
            <>
              <FilterSortBar visible={filterOpen} filters={filters}
                onAddFilter={f=>setFilters(p=>[...p,f])}
                onRemoveFilter={i=>setFilters(p=>p.filter((_,j)=>j!==i))}
                sortConfig={sortConfig} onSort={setSortConfig}/>

              <SpreadsheetGrid ss={ss} gridData={processedData}
                onRowDoubleClick={setDetailRow}/>

              <StatusBar/>

              {detailRow!==null && (
                <RowDetailPanel rowIndex={detailRow} onClose={()=>setDetailRow(null)} ss={ss}/>
              )}

              {/* Shortcut hints */}
              <div className="absolute bottom-8 left-4 hidden xl:flex items-center gap-4 pointer-events-none">
                {[['Ctrl+Z','Undo'],['Ctrl+F','Search'],['Ctrl+B','Bold'],['Alt+R','Row'],['Alt+A','AI']].map(([k,l])=>(
                  <div key={k} className="flex items-center gap-1.5">
                    <span className="kbd">{k}</span>
                    <span className="text-[10px]" style={{color:'#0F172A'}}>{l}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState onCreateSheet={()=>ss.createSheet('New Sheet')} onToggleAI={store.toggleAI}/>
          )}
        </div>

        <AIPanel ss={ss} onApplyFilter={handleApplyFilter}/>
      </div>

      <MobileNav activeTab={mobileTab} setActiveTab={setMobileTab} onToggleFilter={()=>setFilterOpen(v=>!v)}/>

      {/* Overlays */}
      {store.searchOpen && <SearchOverlay onClose={()=>store.setSearchOpen(false)}/>}
      <KeyboardShortcutsModal/>
      {cfOpen && (
        <ConditionalFormattingPanel columns={store.columns} rules={store.condRules}
          onAdd={ss.addCondRule} onRemove={ss.removeCondRule} onClose={()=>setCfOpen(false)}/>
      )}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full" style={{background:'#080812'}}>
      <div className="app-bg"/>
      <div className="text-center relative z-10 anim-scale">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-4xl font-black mx-auto mb-5"
          style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)',boxShadow:'0 12px 40px rgba(79,70,229,.55)'}}>
          A
        </div>
        <h1 className="font-black text-xl gradient-text mb-2">AirBase</h1>
        <div className="flex justify-center gap-1.5 mt-4">
          {[0,1,2].map(i=>(
            <div key={i} className="w-2 h-2 rounded-full bg-indigo-500"
              style={{animation:'dot-bounce 1.2s ease-in-out infinite',animationDelay:`${i*.2}s`}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreateSheet, onToggleAI }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 anim-up relative z-10">
      <div className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8"
        style={{background:'rgba(99,102,241,.07)',border:'1px solid rgba(99,102,241,.15)'}}>
        <Table2 size={48} style={{color:'rgba(99,102,241,.4)'}}/>
      </div>
      <h2 className="font-black text-2xl text-white mb-3">No sheet open</h2>
      <p className="text-sm mb-8 max-w-xs text-center" style={{color:'#334155'}}>
        Create a new sheet or ask the AI to generate one from a description
      </p>
      <div className="flex gap-3">
        <button onClick={onCreateSheet}
          className="btn btn-primary px-6 py-3 text-sm">
          <Layers size={15}/>Create Sheet
        </button>
        <button onClick={onToggleAI}
          className="btn btn-ghost px-6 py-3 text-sm" style={{border:'1px solid rgba(99,102,241,.2)'}}>
          <Bot size={15}/>Ask AI
        </button>
      </div>
    </div>
  )
}
