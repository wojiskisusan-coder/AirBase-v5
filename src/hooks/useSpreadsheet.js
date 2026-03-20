// hooks/useSpreadsheet.js — Full orchestration with undo, formatting, AI features
import { useCallback, useRef } from 'react'
import { useStore }     from '../store/spreadsheetStore'
import { sheetsDb }     from '../lib/supabase'
import { computeSheet } from '../lib/hyperformula'
import toast from 'react-hot-toast'

const AUTOSAVE_DELAY = 1500

export function useSpreadsheet() {
  const store     = useStore()
  const saveTimer = useRef(null)
  const computedData = computeSheet(store.gridData)

  const scheduleSave = useCallback(() => {
    store.setDirty(true)
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(saveActiveSheet, AUTOSAVE_DELAY)
  }, [store.activeSheetId])

  const saveActiveSheet = useCallback(async () => {
    if (!store.activeSheetId) return
    store.setSaving(true)
    try {
      const { error } = await sheetsDb.update(store.activeSheetId, {
        columns:     store.columns,
        rows:        store.gridData,
        cellFormats: store.cellFormats,
        hiddenCols:  store.hiddenCols,
        condRules:   store.condRules,
        frozenRows:  store.frozenRows,
        frozenCols:  store.frozenCols,
        comments:    store.comments,
      })
      if (error) throw error
      store.setDirty(false)
    } catch (err) {
      toast.error(`Save failed: ${err.message}`)
    } finally {
      store.setSaving(false)
    }
  }, [store.activeSheetId, store.columns, store.gridData, store.cellFormats])

  const handleCellChange = useCallback((row, col, value) => {
    store.pushUndo()
    store.updateCell(row, col, value)
    scheduleSave()
  }, [scheduleSave])

  const loadSheets = useCallback(async (userId) => {
    const { data, error } = await sheetsDb.list(userId)
    if (error) { toast.error('Failed to load sheets'); return }
    store.setSheets(data || [])
    if (data?.length) store.loadSheet(data[0])
  }, [])

  const createSheet = useCallback(async (name='Sheet 1') => {
    if (!store.user) return
    const { data, error } = await sheetsDb.create(store.user.id, name)
    if (error) { toast.error('Failed to create sheet'); return }
    store.addSheet(data)
    store.loadSheet(data)
    toast.success(`"${name}" created`)
  }, [store.user])

  const deleteSheet = useCallback(async (id) => {
    const { error } = await sheetsDb.delete(id)
    if (error) { toast.error('Delete failed'); return }
    store.removeSheet(id)
    toast.success('Sheet deleted')
  }, [])

  const switchSheet = useCallback((sheet) => {
    store.loadSheet(sheet)
  }, [])

  const applyAITable = useCallback(async (result) => {
    const { tableName, columns, rows } = result
    store.pushUndo()
    const newCols = columns.map((c,i) => ({
      key:c.key||`col_${i}`, title:c.title, type:c.type||'text', options:c.options||[], width:150,
    }))
    const newGrid = rows.map(row => newCols.map(c => {
      const v = row[c.key] ?? row[c.title] ?? ''
      return v === null ? '' : String(v)
    }))
    while (newGrid.length < 50) newGrid.push(Array(newCols.length).fill(''))
    store.setColumns(newCols)
    store.setGridData(newGrid)
    scheduleSave()
    toast.success(`Table "${tableName}" applied!`)
  }, [scheduleSave])

  // ── Bulk row operations ───────────────────────────────
  const pasteRows = useCallback((rows2D) => {
    store.pushUndo()
    const { row, col } = store.selectedCell
    const next = store.gridData.map(r=>[...r])
    rows2D.forEach((row2D, ri) => {
      if (!next[row+ri]) next[row+ri] = Array(store.columns.length).fill('')
      row2D.forEach((val, ci) => { next[row+ri][col+ci] = val })
    })
    store.setGridData(next)
    scheduleSave()
  }, [store.selectedCell, store.gridData, scheduleSave])

  const applySmartPaste = useCallback((rows2D) => {
    store.pushUndo()
    const cleanRows = store.gridData.map(r=>[...r])
    // Find first empty row
    let startRow = cleanRows.findIndex(r => r.every(c => c === '' || c == null))
    if (startRow === -1) startRow = cleanRows.length
    rows2D.forEach((r, i) => {
      if (!cleanRows[startRow+i]) cleanRows.push(Array(store.columns.length).fill(''))
      r.forEach((val, ci) => { if (ci < store.columns.length) cleanRows[startRow+i][ci] = val })
    })
    store.setGridData(cleanRows)
    scheduleSave()
    toast.success(`${rows2D.length} rows pasted from AI`)
  }, [store.gridData, store.columns, scheduleSave])

  const applyAutoFill = useCallback((colIdx, values) => {
    store.pushUndo()
    const next = store.gridData.map((r,ri) => {
      const row = [...r]
      if (values[ri] !== undefined) row[colIdx] = values[ri]
      return row
    })
    store.setGridData(next)
    scheduleSave()
    toast.success('Column auto-filled by AI')
  }, [store.gridData, scheduleSave])

  const withUndo = useCallback((fn) => {
    store.pushUndo()
    fn()
    scheduleSave()
  }, [scheduleSave])

  return {
    columns:       store.columns,
    gridData:      store.gridData,
    computedData,
    sheets:        store.sheets,
    activeSheetId: store.activeSheetId,
    selectedCell:  store.selectedCell,
    isDirty:       store.isDirty,
    isSaving:      store.isSaving,
    cellFormats:   store.cellFormats,
    condRules:     store.condRules,
    hiddenCols:    store.hiddenCols,
    frozenRows:    store.frozenRows,
    frozenCols:    store.frozenCols,
    comments:      store.comments,
    canUndo:       store.undoStack.length > 0,
    canRedo:       store.redoStack.length > 0,

    handleCellChange,
    loadSheets,
    createSheet,
    deleteSheet,
    switchSheet,
    saveActiveSheet,
    applyAITable,
    pasteRows,
    applySmartPaste,
    applyAutoFill,

    addColumn:      () => withUndo(store.addColumn),
    addRow:         () => withUndo(store.addRow),
    removeColumn:   (i) => withUndo(() => store.removeColumn(i)),
    removeRow:      (i) => withUndo(() => store.removeRow(i)),
    duplicateRow:   (i) => withUndo(() => store.duplicateRow(i)),
    updateColumn:   (i,p) => { store.updateColumn(i,p); scheduleSave() },
    updateCellFormat:(r,c,p) => { store.updateCellFormat(r,c,p); scheduleSave() },
    setComment:     (r,c,t) => { store.setComment(r,c,t); scheduleSave() },
    addCondRule:    (rule) => { store.addCondRule(rule); scheduleSave() },
    removeCondRule: (id)   => { store.removeCondRule(id); scheduleSave() },
    setFrozen:      (r,c)  => { store.setFrozen(r,c); scheduleSave() },
    toggleHideCol:  (i)    => { store.toggleHideCol(i); scheduleSave() },
    undo:           store.undo,
    redo:           store.redo,
    setSelectedCell: store.setSelectedCell,
    setSelectedRange: store.setSelectedRange,
  }
}
