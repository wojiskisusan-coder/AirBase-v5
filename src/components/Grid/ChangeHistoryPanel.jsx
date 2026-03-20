// ChangeHistoryPanel.jsx — UNIQUE: full audit log of all changes
import { Clock, Edit3, Wand2, Trash2, Copy, X } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

const ACTION_ICONS = {
  'edit':           <Edit3 size={12}/>,
  'ai-generate':    <Wand2 size={12}/>,
  'delete-rows':    <Trash2 size={12}/>,
  'duplicate-row':  <Copy size={12}/>,
}
const ACTION_COLORS = {
  'edit':          '#818CF8',
  'ai-generate':   '#34D399',
  'delete-rows':   '#F87171',
  'duplicate-row': '#FBBF24',
}

function timeAgo(ts) {
  const s = Math.floor((Date.now()-new Date(ts).getTime())/1000)
  if(s<60)  return `${s}s ago`
  if(s<3600)return `${Math.floor(s/60)}m ago`
  return `${Math.floor(s/3600)}h ago`
}

export function ChangeHistoryPanel({ onClose }) {
  const store = useStore()
  const log   = store.changeLog

  return(
    <div className="row-detail-panel flex flex-col">
      <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-2">
          <Clock size={15} color="#6366F1"/>
          <h3 className="font-semibold text-sm text-white">Change History</h3>
          {log.length>0&&<span className="badge badge-indigo">{log.length}</span>}
        </div>
        <button onClick={onClose} className="fmt-btn"><X size={13}/></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {log.length===0&&(
          <div className="flex flex-col items-center justify-center h-48 text-center px-6">
            <Clock size={32} className="mb-3 opacity-20"/>
            <p className="text-sm" style={{color:'#334155'}}>No changes yet</p>
            <p className="text-xs mt-1" style={{color:'#1E293B'}}>Every edit will appear here</p>
          </div>
        )}
        {log.map((entry,i)=>(
          <div key={i} className="flex items-start gap-3 px-5 py-3 animate-fade-up"
            style={{borderBottom:'1px solid rgba(255,255,255,0.03)',animationDelay:`${i*15}ms`}}>
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{background:`${ACTION_COLORS[entry.action]||'#818CF8'}18`,color:ACTION_COLORS[entry.action]||'#818CF8'}}>
              {ACTION_ICONS[entry.action]||<Edit3 size={12}/>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{entry.detail}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px]" style={{color:'#334155'}}>{timeAgo(entry.ts)}</span>
                {entry.user&&<span className="text-[10px] truncate" style={{color:'#1E293B'}}>{entry.user}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
