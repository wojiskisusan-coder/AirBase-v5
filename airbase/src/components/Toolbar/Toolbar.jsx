// Toolbar.jsx — with theme toggle + PWA install button
import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../store/spreadsheetStore'
import { auth } from '../../lib/supabase'
import { exportCSV, exportXLSX } from '../Import/importExport'
import { applyTheme, getStoredTheme } from '../../lib/theme'
import { Plus, Download, Upload, Filter, Search, Bot, Undo2, Redo2,
         ChevronDown, Sun, Moon, PanelLeft, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export function Toolbar({ onImport, ss, onToggleFilter, filterActive, onToggleSearch }) {
  const store     = useStore()
  const sheet     = store.sheets.find(s=>s.id===store.activeSheetId)
  const [expOpen, setExpOpen]   = useState(false)
  const [addOpen, setAddOpen]   = useState(false)
  const [theme,   setTheme]     = useState(getStoredTheme)
  const [pwaEvt,  setPwaEvt]    = useState(null)

  // Capture PWA install prompt
  useEffect(()=>{
    const h = e=>{ e.preventDefault(); setPwaEvt(e) }
    window.addEventListener('beforeinstallprompt', h)
    return()=>window.removeEventListener('beforeinstallprompt', h)
  },[])

  const toggleTheme = ()=>{
    const next = theme==='dark'?'light':'dark'
    setTheme(next)
    applyTheme(next)
    // Update meta theme-color
    document.getElementById('meta-theme')?.setAttribute('content', next==='light'?'#4F46E5':'#080812')
  }

  const installPWA = async()=>{
    if(!pwaEvt) return
    pwaEvt.prompt()
    const {outcome} = await pwaEvt.userChoice
    if(outcome==='accepted'){ setPwaEvt(null); toast.success('AirBase installed!') }
  }

  return(
    <header className="shrink-0 z-20 relative" style={{
      background:'var(--bg-surface)',borderBottom:'1px solid var(--border)',
    }}>
      <div className="flex items-center gap-1 px-3 h-12">

        {/* Sidebar toggle */}
        <button className="toolbar-btn mr-1" onClick={store.toggleSidebar} title="Toggle sidebar">
          <PanelLeft size={14}/>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-2 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',boxShadow:'0 0 14px rgba(79,70,229,0.4)'}}>
            A
          </div>
          <span className="font-bold text-sm tracking-tight phone-hide" style={{color:'var(--text-primary)'}}>AirBase</span>
        </div>

        <div className="h-5 w-px mx-1" style={{background:'var(--border)'}}/>

        {/* Add */}
        <div className="relative">
          <button className="toolbar-btn" onClick={()=>setAddOpen(!addOpen)}>
            <Plus size={13}/><span className="tablet-hide">Add</span><ChevronDown size={10}/>
          </button>
          {addOpen&&(
            <div className="ctx-menu absolute top-full mt-1 left-0 z-50 animate-slide-down">
              <div className="ctx-item" onClick={()=>{ss.addRow();setAddOpen(false)}}><Plus size={12}/> Add Row</div>
              <div className="ctx-item" onClick={()=>{ss.addColumn();setAddOpen(false)}}><Plus size={12}/> Add Column</div>
            </div>
          )}
        </div>

        {/* Undo/Redo */}
        <button className="toolbar-btn" onClick={ss.undo} disabled={!ss.canUndo} title="Undo (Ctrl+Z)" style={{opacity:ss.canUndo?1:.3}}>
          <Undo2 size={13}/>
        </button>
        <button className="toolbar-btn" onClick={ss.redo} disabled={!ss.canRedo} title="Redo (Ctrl+Y)" style={{opacity:ss.canRedo?1:.3}}>
          <Redo2 size={13}/>
        </button>

        <div className="h-5 w-px mx-1" style={{background:'var(--border)'}}/>

        {/* Import */}
        <label className="toolbar-btn cursor-pointer" title="Import CSV">
          <Upload size={13}/><span className="tablet-hide">Import</span>
          <input type="file" accept=".csv" className="hidden" onChange={onImport}/>
        </label>

        {/* Export */}
        <div className="relative">
          <button className="toolbar-btn" onClick={()=>setExpOpen(!expOpen)}>
            <Download size={13}/><span className="tablet-hide">Export</span><ChevronDown size={10}/>
          </button>
          {expOpen&&(
            <div className="ctx-menu absolute top-full mt-1 left-0 z-50 animate-slide-down">
              <div className="ctx-item" onClick={()=>{exportCSV(store.columns,store.gridData,sheet?.name);setExpOpen(false)}}>
                <Download size={12}/> Export CSV
              </div>
              <div className="ctx-item" onClick={()=>{exportXLSX(store.columns,store.gridData,sheet?.name);setExpOpen(false)}}>
                <Download size={12}/> Export XLSX
              </div>
            </div>
          )}
        </div>

        <div className="h-5 w-px mx-1 desktop-only" style={{background:'var(--border)'}}/>

        <button className={`toolbar-btn desktop-only ${filterActive?'active':''}`} onClick={onToggleFilter}>
          <Filter size={13}/><span className="tablet-hide">Filter</span>
        </button>
        <button className="toolbar-btn tablet-hide" onClick={onToggleSearch}>
          <Search size={13}/><span>Search</span>
        </button>

        <div className="flex-1"/>

        {/* Save badge */}
        <div className="phone-hide">
          {store.isSaving?<span className="badge badge-amber">Saving</span>
          :store.isDirty? <span className="badge badge-amber">Unsaved</span>
          :               <span className="badge badge-green">Saved</span>}
        </div>

        <div className="h-5 w-px mx-2" style={{background:'var(--border)'}}/>

        {/* PWA install */}
        {pwaEvt&&(
          <button onClick={installPWA} className="toolbar-btn primary phone-hide" title="Install app">
            Install App
          </button>
        )}

        {/* Theme toggle */}
        <button className="fmt-btn" onClick={toggleTheme} title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>
          {theme==='dark'?<Sun size={14}/>:<Moon size={14}/>}
        </button>

        {/* AI toggle */}
        <button className={`toolbar-btn ${store.aiPanelOpen?'active':''}`} onClick={store.toggleAI} title="AI Assistant (Alt+A)">
          <Bot size={13}/><span className="tablet-hide">AI</span>
        </button>

        {/* User */}
        <button onClick={()=>{auth.signOut();toast.success('Signed out')}}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ml-1 transition-transform hover:scale-105"
          style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)'}}
          title={`${store.user?.email} — click to sign out`}>
          {(store.user?.email?.[0]??'?').toUpperCase()}
        </button>
      </div>
    </header>
  )
}
