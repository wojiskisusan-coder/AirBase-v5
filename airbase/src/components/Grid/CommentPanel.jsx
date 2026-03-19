// CommentPanel.jsx — Add/view cell comment
import { useState } from 'react'
import { MessageSquare, Trash2, X } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'
import { colIndexToLetter } from '../../lib/hyperformula'

export function CommentPanel({ onClose }) {
  const store = useStore()
  const { row, col } = store.selectedCell
  const key   = `${row}:${col}`
  const existing = store.comments[key]
  const [text, setText] = useState(existing?.text||'')
  const cellAddr = `${colIndexToLetter(col)}${row+1}`

  const save = () => {
    if(text.trim()) { store.setComment(row,col,text.trim()); onClose() }
  }
  const remove = () => { store.removeComment(row,col); onClose() }

  return(
    <div className="ctx-menu animate-scale-in p-4" style={{width:280,position:'fixed',zIndex:200,top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} color="#6366F1"/>
          <span className="text-xs font-semibold text-white">Comment — {cellAddr}</span>
        </div>
        <button onClick={onClose} className="fmt-btn"><X size={12}/></button>
      </div>
      <textarea value={text} onChange={e=>setText(e.target.value)}
        placeholder="Add a comment…" rows={3}
        className="input-base text-xs resize-none mb-3"
        style={{fontFamily:'Inter,sans-serif'}}
      />
      <div className="flex gap-2">
        <button onClick={save} className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
          style={{background:'linear-gradient(135deg,#4F46E5,#7C3AED)'}}>
          Save
        </button>
        {existing&&<button onClick={remove} className="fmt-btn danger px-3" title="Remove comment"><Trash2 size={12}/></button>}
        <button onClick={onClose} className="px-3 py-2 rounded-xl text-xs" style={{background:'rgba(255,255,255,0.05)',color:'#64748B'}}>Cancel</button>
      </div>
    </div>
  )
}
