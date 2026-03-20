// KeyboardShortcutsModal.jsx
import { X } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

const SHORTCUTS = [
  { group:'Navigation', items:[
    ['Ctrl+F / Cmd+F','Global search'],['Alt+A','Toggle AI panel'],
    ['Alt+F','Toggle filter bar'],['Esc','Close panels'],
  ]},
  { group:'Editing', items:[
    ['Ctrl+Z','Undo'],['Ctrl+Y / Ctrl+Shift+Z','Redo'],
    ['Alt+R','Add row'],['Alt+C','Add column'],
    ['Delete','Clear selected cell'],['Ctrl+D','Duplicate row'],
  ]},
  { group:'Formatting', items:[
    ['Ctrl+B','Bold'],['Ctrl+I','Italic'],['Ctrl+U','Underline'],
  ]},
  { group:'Data', items:[
    ['Double-click row','Open row detail panel'],
    ['Right-click column header','Column menu'],
    ['Enter in formula bar','Confirm formula'],
    ['=SUM(A1:A10)','Example formula'],
  ]},
]

export function KeyboardShortcutsModal() {
  const store = useStore()
  if (!store.shortcutsOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,.7)',backdropFilter:'blur(8px)'}}>
      <div className="w-full max-w-2xl glass-lg rounded-2xl overflow-hidden anim-scale">
        <div className="flex items-center justify-between px-6 py-4" style={{borderBottom:'1px solid rgba(255,255,255,.07)'}}>
          <h2 className="font-bold text-white">Keyboard Shortcuts</h2>
          <button className="btn btn-ghost btn-icon" onClick={()=>store.setShortcutsOpen(false)}><X size={16}/></button>
        </div>
        <div className="grid grid-cols-2 gap-6 p-6 overflow-y-auto max-h-96">
          {SHORTCUTS.map(({group,items})=>(
            <div key={group}>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:'#4F46E5'}}>{group}</h3>
              <div className="space-y-2">
                {items.map(([key,label])=>(
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="kbd text-xs">{key}</span>
                    <span className="text-xs text-right flex-1" style={{color:'#64748B'}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
