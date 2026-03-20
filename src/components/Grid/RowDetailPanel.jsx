// components/Grid/RowDetailPanel.jsx
// Right-side panel showing full row data in a form-like view
import { useState, useEffect } from 'react'
import { useStore } from '../../store/spreadsheetStore'

export function RowDetailPanel({ rowIndex, onClose, ss }) {
  const store = useStore()
  const [values, setValues] = useState([])

  useEffect(() => {
    if (rowIndex == null) return
    setValues(store.gridData[rowIndex]?.map((v) => v ?? '') ?? [])
  }, [rowIndex, store.gridData])

  if (rowIndex == null) return null

  const handleSave = () => {
    values.forEach((val, colIdx) => ss.handleCellChange(rowIndex, colIdx, val))
    onClose()
  }

  const typeIcon = { text: '🔤', number: '🔢', date: '📅', boolean: '☑️', select: '📋' }
  const typeColor = { text: '#818CF8', number: '#34D399', date: '#FBBF24', boolean: '#F87171', select: '#A78BFA' }

  return (
    <div className="row-detail-panel flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div>
          <h3 className="font-semibold text-sm text-white">Row {rowIndex + 1}</h3>
          <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{store.columns.length} fields</p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: '#475569' }}>✕</button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {store.columns.map((col, i) => (
          <div key={col.key} className="animate-fade-up" style={{ animationDelay: `${i * 25}ms` }}>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5">
              <span>{typeIcon[col.type] || '🔤'}</span>
              <span style={{ color: '#94A3B8' }}>{col.title}</span>
              <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${typeColor[col.type] || '#818CF8'}18`, color: typeColor[col.type] || '#818CF8' }}>
                {col.type}
              </span>
            </label>

            {col.type === 'boolean' ? (
              <button
                onClick={() => {
                  const next = [...values]
                  next[i] = values[i] === 'true' || values[i] === true ? 'false' : 'true'
                  setValues(next)
                }}
                className="flex items-center gap-2 text-sm transition-all"
              >
                <div className={`w-10 h-5 rounded-full transition-all ${values[i] === 'true' || values[i] === true ? 'bg-indigo-500' : 'bg-white/10'}`}
                  style={{ padding: '2px' }}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${values[i] === 'true' || values[i] === true ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
                <span style={{ color: '#94A3B8' }}>{values[i] === 'true' || values[i] === true ? 'True' : 'False'}</span>
              </button>
            ) : col.type === 'select' && col.options?.length > 0 ? (
              <select
                value={values[i] || ''}
                onChange={(e) => { const n=[...values]; n[i]=e.target.value; setValues(n) }}
                className="input-base text-sm py-2"
              >
                <option value="">— Select —</option>
                {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                value={values[i] || ''}
                onChange={(e) => { const n=[...values]; n[i]=e.target.value; setValues(n) }}
                className="input-base text-sm py-2"
                style={{ fontFamily: col.type === 'number' ? 'Fira Code, monospace' : undefined }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 flex gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={handleSave}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 15px rgba(79,70,229,0.4)' }}>
          Save Changes
        </button>
        <button onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#94A3B8' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}
