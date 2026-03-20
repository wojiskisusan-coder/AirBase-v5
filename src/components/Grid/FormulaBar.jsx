// components/Grid/FormulaBar.jsx
// ─────────────────────────────────────────────────────────
// Excel-style formula bar above the grid.
// Displays selected cell address and its raw value/formula.
// Supports direct formula/value editing.
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

export function FormulaBar({ address, value, onChange }) {
  const [localVal, setLocalVal] = useState(value)
  const isFormula = typeof localVal === 'string' && localVal.startsWith('=')

  // Sync when selection changes
  useEffect(() => { setLocalVal(value ?? '') }, [value, address])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onChange(localVal)
      e.target.blur()
    }
    if (e.key === 'Escape') {
      setLocalVal(value)
      e.target.blur()
    }
  }

  return (
    <div className="formula-bar">
      {/* Cell address box */}
      <div className="px-2 py-0.5 bg-surface border border-surface-border rounded text-xs text-slate-400 font-mono min-w-[52px] text-center">
        {address}
      </div>

      {/* Function indicator */}
      <span className="text-primary-light font-bold text-sm font-mono select-none">ƒx</span>

      {/* Formula / value input */}
      <input
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onChange(localVal)}
        className={isFormula ? 'text-emerald-400' : ''}
        placeholder="Enter value or formula (=SUM, =IF, …)"
        spellCheck={false}
      />
    </div>
  )
}
