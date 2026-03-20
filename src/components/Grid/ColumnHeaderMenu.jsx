// ColumnHeaderMenu.jsx — Column right-click / header click menu
import { useState } from 'react'
import { Type, Hash, Calendar, ToggleLeft, List, SortAsc, SortDesc,
         EyeOff, Eye, Trash2, Copy, PinIcon, ChevronRight, Wand2 } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

const TYPES = [
  { value:'text',    label:'Text',    Icon:Type },
  { value:'number',  label:'Number',  Icon:Hash },
  { value:'date',    label:'Date',    Icon:Calendar },
  { value:'boolean', label:'Boolean', Icon:ToggleLeft },
  { value:'select',  label:'Select',  Icon:List },
]

export function ColumnHeaderMenu({ colIdx, position, onClose, ss, onSort, onAutoFill }) {
  const store   = useStore()
  const col     = store.columns[colIdx]
  const hidden  = store.hiddenCols.includes(colIdx)
  const [renaming, setRenaming] = useState(false)
  const [name,     setName]     = useState(col?.title ?? '')
  const [showTypes,setShowTypes]= useState(false)

  if (!col) return null

  const act = (fn) => { fn(); onClose() }

  return (
    <div className="ctx-menu" style={{ position:'fixed', left:position.x, top:position.y, zIndex:500 }}
      onClick={e=>e.stopPropagation()}>

      {/* Column name */}
      {renaming ? (
        <div className="px-2 pb-2">
          <input className="input text-xs py-1.5" value={name} autoFocus
            onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{
              if(e.key==='Enter'){ss.updateColumn(colIdx,{title:name});onClose()}
              if(e.key==='Escape')onClose()
            }}/>
        </div>
      ) : (
        <div className="ctx-item font-semibold text-white" onClick={()=>setRenaming(true)}>
          <Type size={13}/>{col.title}
          <span className="ml-auto text-[10px] opacity-40">click to rename</span>
        </div>
      )}

      <div className="ctx-sep"/>

      {/* Change type submenu */}
      <div className="relative group">
        <div className="ctx-item justify-between" onMouseEnter={()=>setShowTypes(true)} onMouseLeave={()=>setShowTypes(false)}>
          <span className="flex items-center gap-2.5"><Hash size={13}/>Change Type</span>
          <ChevronRight size={12} className="opacity-40"/>
        </div>
        {showTypes && (
          <div className="ctx-menu absolute left-full top-0 ml-1" onMouseEnter={()=>setShowTypes(true)} onMouseLeave={()=>setShowTypes(false)}>
            {TYPES.map(({value,label,Icon})=>(
              <div key={value} className={`ctx-item ${col.type===value?'btn-active':''}`}
                onClick={()=>act(()=>ss.updateColumn(colIdx,{type:value}))}>
                <Icon size={13}/>{label}
                {col.type===value && <span className="ml-auto text-[10px] opacity-60">current</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ctx-sep"/>

      {/* Sort */}
      <div className="ctx-item" onClick={()=>act(()=>onSort({colIdx,dir:'asc'}))}>
        <SortAsc size={13}/>Sort A → Z
      </div>
      <div className="ctx-item" onClick={()=>act(()=>onSort({colIdx,dir:'desc'}))}>
        <SortDesc size={13}/>Sort Z → A
      </div>

      <div className="ctx-sep"/>

      {/* Freeze */}
      <div className="ctx-item" onClick={()=>act(()=>ss.setFrozen(0, colIdx+1))}>
        <PinIcon size={13}/>Freeze up to here
      </div>
      <div className="ctx-item" onClick={()=>act(()=>ss.setFrozen(0, 0))}>
        <PinIcon size={13}/>Unfreeze columns
      </div>

      <div className="ctx-sep"/>

      {/* AI Auto-fill */}
      <div className="ctx-item" style={{color:'#818CF8'}} onClick={()=>act(()=>onAutoFill(colIdx))}>
        <Wand2 size={13}/>AI Auto-Fill Column
      </div>

      <div className="ctx-sep"/>

      {/* Hide / Show */}
      <div className="ctx-item" onClick={()=>act(()=>ss.toggleHideCol(colIdx))}>
        {hidden ? <Eye size={13}/> : <EyeOff size={13}/>}
        {hidden ? 'Show Column' : 'Hide Column'}
      </div>

      {/* Duplicate col */}
      <div className="ctx-item" onClick={()=>act(()=>{
        const newCol = {...col, key:`col_${Date.now()}`, title:`${col.title} (copy)`}
        store.setColumns([...store.columns.slice(0,colIdx+1), newCol, ...store.columns.slice(colIdx+1)])
        const newGrid = store.gridData.map(r=>[...r.slice(0,colIdx+1), r[colIdx]??'', ...r.slice(colIdx+1)])
        store.setGridData(newGrid)
      })}>
        <Copy size={13}/>Duplicate Column
      </div>

      <div className="ctx-sep"/>

      {/* Delete */}
      <div className="ctx-item danger" onClick={()=>act(()=>ss.removeColumn(colIdx))}>
        <Trash2 size={13}/>Delete Column
      </div>
    </div>
  )
}
