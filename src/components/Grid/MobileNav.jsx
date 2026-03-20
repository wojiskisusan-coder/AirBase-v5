import { useStore } from '../../store/spreadsheetStore'
import { Table2, Layers, Bot, SlidersHorizontal } from 'lucide-react'

export function MobileNav({ activeTab, setActiveTab }) {
  const store = useStore()

  const tabs = [
    { id: 'grid',   icon: <Table2 size={18} />,           label: 'Grid'   },
    { id: 'sheets', icon: <Layers size={18} />,            label: 'Sheets' },
    { id: 'ai',     icon: <Bot size={18} />,               label: 'AI'     },
    { id: 'filter', icon: <SlidersHorizontal size={18} />, label: 'Filter' },
  ]

  return (
    <nav className="mobile-nav">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`mobile-nav-btn ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => setActiveTab(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
