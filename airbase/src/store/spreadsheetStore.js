// store/spreadsheetStore.js — Extended store with undo, formatting, hidden cols, conditional rules
import { create } from 'zustand'

const DEFAULT_COLS = 10
const DEFAULT_ROWS = 50
const MAX_UNDO     = 50

const emptyGrid    = (r=DEFAULT_ROWS, c=DEFAULT_COLS) => Array.from({length:r}, ()=>Array(c).fill(''))
const defaultCols  = (n=DEFAULT_COLS) => Array.from({length:n}, (_,i) => ({
  key:`col_${i}`, title:String.fromCharCode(65+i), type:'text', width:120,
}))

export const useStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────
  user: null,
  setUser: (user) => set({ user }),

  // ── Sheets ────────────────────────────────────────────
  sheets:        [],
  activeSheetId: null,
  setSheets:     (sheets) => set({ sheets }),
  addSheet:      (s)      => set(st => ({ sheets: [...st.sheets, s] })),
  removeSheet:   (id)     => set(st => ({
    sheets: st.sheets.filter(s => s.id !== id),
    activeSheetId: st.activeSheetId === id ? st.sheets[0]?.id ?? null : st.activeSheetId,
  })),
  setActiveSheet: (id) => set({ activeSheetId: id }),

  // ── Grid data ─────────────────────────────────────────
  columns:  defaultCols(),
  gridData: emptyGrid(),
  setColumns:  (columns)  => set({ columns }),
  setGridData: (gridData) => set({ gridData }),

  // ── Undo / Redo ───────────────────────────────────────
  undoStack: [],
  redoStack: [],

  pushUndo: () => set(st => {
    const snapshot = { columns: st.columns.map(c=>({...c})), gridData: st.gridData.map(r=>[...r]) }
    const stack = [...st.undoStack, snapshot].slice(-MAX_UNDO)
    return { undoStack: stack, redoStack: [] }
  }),

  undo: () => set(st => {
    if (!st.undoStack.length) return st
    const prev   = st.undoStack[st.undoStack.length - 1]
    const redoSnap = { columns: st.columns.map(c=>({...c})), gridData: st.gridData.map(r=>[...r]) }
    return {
      columns:   prev.columns,
      gridData:  prev.gridData,
      undoStack: st.undoStack.slice(0,-1),
      redoStack: [...st.redoStack, redoSnap],
    }
  }),

  redo: () => set(st => {
    if (!st.redoStack.length) return st
    const next = st.redoStack[st.redoStack.length - 1]
    const undoSnap = { columns: st.columns.map(c=>({...c})), gridData: st.gridData.map(r=>[...r]) }
    return {
      columns:   next.columns,
      gridData:  next.gridData,
      redoStack: st.redoStack.slice(0,-1),
      undoStack: [...st.undoStack, undoSnap],
    }
  }),

  // ── Cell operations ───────────────────────────────────
  updateCell: (row, col, value) => set(st => {
    const next = st.gridData.map(r=>[...r])
    if (!next[row]) next[row] = []
    next[row][col] = value
    return { gridData: next }
  }),

  // ── Column operations ─────────────────────────────────
  addColumn: () => set(st => {
    const idx = st.columns.length
    const col = { key:`col_${Date.now()}`, title:String.fromCharCode(65+idx%26), type:'text', width:120 }
    return { columns:[...st.columns,col], gridData:st.gridData.map(r=>[...r,'']) }
  }),
  removeColumn: (i) => set(st => ({
    columns:  st.columns.filter((_,j)=>j!==i),
    gridData: st.gridData.map(r=>r.filter((_,j)=>j!==i)),
  })),
  updateColumn: (i, patch) => set(st => ({
    columns: st.columns.map((c,j)=>j===i?{...c,...patch}:c),
  })),

  // ── Row operations ────────────────────────────────────
  addRow:       ()  => set(st => ({ gridData:[...st.gridData, Array(st.columns.length).fill('')] })),
  removeRow:    (i) => set(st => ({ gridData:st.gridData.filter((_,j)=>j!==i) })),
  duplicateRow: (i) => set(st => {
    const next = [...st.gridData]
    next.splice(i+1, 0, [...st.gridData[i]])
    return { gridData: next }
  }),

  // ── Load sheet ────────────────────────────────────────
  loadSheet: (sheet) => set({
    columns:       sheet.columns?.length ? sheet.columns : defaultCols(),
    gridData:      sheet.rows?.length    ? sheet.rows    : emptyGrid(),
    activeSheetId: sheet.id,
    cellFormats:   sheet.cellFormats     ?? {},
    hiddenCols:    sheet.hiddenCols      ?? [],
    condRules:     sheet.condRules       ?? [],
    frozenRows:    sheet.frozenRows      ?? 0,
    frozenCols:    sheet.frozenCols      ?? 0,
    undoStack: [],
    redoStack: [],
  }),

  // ── Cell Formatting ───────────────────────────────────
  // cellFormats: { "r_c": { bold, italic, underline, color, bg, fontSize, align } }
  cellFormats: {},
  setCellFormats: (f) => set({ cellFormats: f }),
  updateCellFormat: (row, col, patch) => set(st => {
    const key = `${row}_${col}`
    return { cellFormats: { ...st.cellFormats, [key]: { ...(st.cellFormats[key]||{}), ...patch } } }
  }),
  clearCellFormat: (row, col) => set(st => {
    const f = { ...st.cellFormats }
    delete f[`${row}_${col}`]
    return { cellFormats: f }
  }),

  // ── Hidden Columns ────────────────────────────────────
  hiddenCols:    [],
  toggleHideCol: (i) => set(st => ({
    hiddenCols: st.hiddenCols.includes(i) ? st.hiddenCols.filter(c=>c!==i) : [...st.hiddenCols, i],
  })),

  // ── Freeze ────────────────────────────────────────────
  frozenRows: 0,
  frozenCols: 0,
  setFrozen:  (rows, cols) => set({ frozenRows:rows, frozenCols:cols }),

  // ── Conditional Formatting Rules ──────────────────────
  // condRules: [{ id, colIdx, op, value, color, bg }]
  condRules:    [],
  setCondRules: (r) => set({ condRules: r }),
  addCondRule:  (rule) => set(st => ({ condRules:[...st.condRules, {...rule, id:Date.now()}] })),
  removeCondRule:(id)  => set(st => ({ condRules:st.condRules.filter(r=>r.id!==id) })),

  // ── Cell Comments ─────────────────────────────────────
  // comments: { "r_c": "text" }
  comments:    {},
  setComment:  (row, col, text) => set(st => ({
    comments: { ...st.comments, [`${row}_${col}`]: text || undefined }
  })),

  // ── Selection ─────────────────────────────────────────
  selectedCell:    { row:0, col:0 },
  selectedRange:   null,
  setSelectedCell: (row, col)   => set({ selectedCell:{row,col} }),
  setSelectedRange:(range)      => set({ selectedRange:range }),

  // ── UI State ──────────────────────────────────────────
  aiPanelOpen:    true,
  sidebarOpen:    true,
  searchOpen:     false,
  shortcutsOpen:  false,
  toggleAI:       () => set(st=>({ aiPanelOpen:!st.aiPanelOpen })),
  toggleSidebar:  () => set(st=>({ sidebarOpen:!st.sidebarOpen })),
  setSearchOpen:  (v) => set({ searchOpen:v }),
  setShortcutsOpen:(v)=> set({ shortcutsOpen:v }),

  // ── Save state ────────────────────────────────────────
  isDirty:   false,
  isSaving:  false,
  setDirty:  (v) => set({ isDirty:v }),
  setSaving: (v) => set({ isSaving:v }),
}))
