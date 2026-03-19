import { LayoutGrid, BookOpen, Bot, Filter } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

export function MobileNav({ activeTab, setActiveTab, onToggleFilter }) {
  const store = useStore()
  const tabs  = [
    {id:'grid',   Icon:LayoutGrid, label:'Grid'},
    {id:'sheets', Icon:BookOpen,   label:'Sheets'},
    {id:'ai',     Icon:Bot,        label:'AI'},
    {id:'filter', Icon:Filter,     label:'Filter'},
  ]
  return (
    <nav className="mobile-nav">
      {tabs.map(({id,Icon,label})=>(
        <button key={id} className={`mobile-nav-btn ${activeTab===id?'active':''}`}
          onClick={()=>{
            setActiveTab(id)
            if(id==='ai') {if(!store.aiPanelOpen)store.toggleAI()}
            if(id==='filter') onToggleFilter?.()
          }}>
          <Icon size={18}/>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
