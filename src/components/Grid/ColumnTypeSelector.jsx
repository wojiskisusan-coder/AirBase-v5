// components/Grid/ColumnTypeSelector.jsx
// ─────────────────────────────────────────────────────────
// Dropdown panel for changing column data type.
// Appears on column header right-click or settings click.
// ─────────────────────────────────────────────────────────
import { useState } from 'react'

const TYPES = [
  { value: 'text',    label: '🔤 Text',    desc: 'Free-form text'        },
  { value: 'number',  label: '🔢 Number',  desc: 'Numeric values'        },
  { value: 'date',    label: '📅 Date',    desc: 'YYYY-MM-DD format'     },
  { value: 'boolean', label: '☑️ Boolean', desc: 'True / False checkbox' },
  { value: 'select',  label: '📋 Select',  desc: 'Dropdown list'         },
]

export function ColumnTypeSelector({ column, colIndex, onUpdate, onClose }) {
  const [type,    setType]    = useState(column.type || 'text')
  const [title,   setTitle]   = useState(column.title)
  const [options, setOptions] = useState((column.options || []).join(', '))

  const handleSave = () => {
    const patch = { type, title }
    if (type === 'select') {
      patch.options = options.split(',').map((o) => o.trim()).filter(Boolean)
    }
    onUpdate(colIndex, patch)
    onClose()
  }

  return (
    <div className="ctx-menu w-64 p-3" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-xs font-semibold text-slate-300 mb-3">Column Settings</h3>

      {/* Title */}
      <label className="block text-xs text-slate-400 mb-1">Column Name</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-surface border border-surface-border rounded px-2 py-1 text-xs text-white mb-3 focus:outline-none focus:border-primary"
      />

      {/* Type selector */}
      <label className="block text-xs text-slate-400 mb-1">Data Type</label>
      <div className="space-y-1 mb-3">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
              type === t.value
                ? 'bg-primary/30 text-primary-light border border-primary/50'
                : 'text-slate-300 hover:bg-surface-border'
            }`}
          >
            <span>{t.label}</span>
            <span className="text-slate-500 text-[10px] ml-auto">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Select options */}
      {type === 'select' && (
        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Options (comma-separated)</label>
          <input
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="Option 1, Option 2, Option 3"
            className="w-full bg-surface border border-surface-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleSave}  className="flex-1 bg-primary text-white text-xs py-1.5 rounded">Save</button>
        <button onClick={onClose}     className="flex-1 bg-surface-border text-slate-300 text-xs py-1.5 rounded">Cancel</button>
      </div>
    </div>
  )
}
