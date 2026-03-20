// Sidebar.jsx — Lucide icons, animated sheet list
import { useState } from 'react'
import { Plus, Table2, Trash2, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

export function Sidebar({ ss }) {
  const store   = useStore()
  const [creating,setCreating] = useState(false)
  const [name,    setName]     = useState('')

  const SHEET_COLORS = ['#6366F1','#8B5CF6','#EC4899','#14B8A6','#F59E0B','#10B981','#3B82F6','#EF4444']

  const handleCreate = async () => {
    if (!name.trim()) return
    await ss.createSheet(name.trim())
    setName(''); setCreating(false)
  }

  if (!store.sidebarOpen) return null

  return (
    <aside className="sidebar w-52 flex flex-col shrink-0 anim-left tablet-hide">

      <div className="flex items-center justify-between px-3 py-3" style={{borderBottom:'1px solid rgba(99,102,241,.1)'}}>
        <span className="text-xs font-bold uppercase tracking-widest" style={{color:'#334155'}}>Sheets</span>
        <button className="btn btn-ghost btn-icon" onClick={()=>setCreating(true)} data-tip="New Sheet" style={{width:24,height:24}}>
          <Plus size={13}/>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {store.sheets.map((sheet,i)=>{
          const active = sheet.id===store.activeSheetId
          const color  = SHEET_COLORS[i%SHEET_COLORS.length]
          const rows   = sheet.rows?.filter(r=>Array.isArray(r)&&r.some(c=>c!==''&&c!=null)).length??0

          return (
            <div key={sheet.id}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all duration-150 anim-up stagger-${Math.min(i+1,4)}`}
              style={{
                background:active?'rgba(99,102,241,.12)':'transparent',
                border:active?'1px solid rgba(99,102,241,.22)':'1px solid transparent',
              }}
              onClick={()=>ss.switchSheet(sheet)}>

              <div className="w-2 h-2 rounded-full shrink-0" style={{background:color,boxShadow:active?`0 0 6px ${color}66`:undefined}}/>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{color:active?'#818CF8':'#64748B'}}>{sheet.name}</div>
                {rows>0 && <div className="text-[9px] mt-0.5" style={{color:'#1E293B'}}>{rows} rows</div>}
              </div>

              {active && <ChevronRight size={11} style={{color:'#4F46E5',flexShrink:0}}/>}

              <button className="opacity-0 group-hover:opacity-100 btn btn-ghost btn-icon transition-opacity"
                style={{width:18,height:18}} onClick={e=>{e.stopPropagation();ss.deleteSheet(sheet.id)}}>
                <Trash2 size={10}/>
              </button>
            </div>
          )
        })}
        {store.sheets.length===0 && (
          <div className="text-center py-10">
            <Table2 size={24} className="mx-auto mb-2 opacity-20"/>
            <p className="text-xs" style={{color:'#1E293B'}}>No sheets yet</p>
          </div>
        )}
      </div>

      {creating && (
        <div className="p-2 anim-up" style={{borderTop:'1px solid rgba(255,255,255,.05)'}}>
          <input autoFocus value={name} onChange={e=>setName(e.target.value)} className="input text-xs py-1.5"
            placeholder="Sheet name…"
            onKeyDown={e=>{if(e.key==='Enter')handleCreate();if(e.key==='Escape')setCreating(false)}}/>
          <div className="flex gap-1.5 mt-1.5">
            <button className="btn btn-primary flex-1 text-xs py-1.5 justify-center" onClick={handleCreate}>Create</button>
            <button className="btn btn-ghost flex-1 text-xs py-1.5 justify-center" onClick={()=>setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}
    </aside>
  )
}
