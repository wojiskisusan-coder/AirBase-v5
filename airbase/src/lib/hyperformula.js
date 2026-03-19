// lib/hyperformula.js
// ─────────────────────────────────────────────────────────
// HyperFormula engine singleton.
// Handles formula calculation, dependency tracking,
// and cell value resolution for the spreadsheet grid.
// ─────────────────────────────────────────────────────────
import { HyperFormula } from 'hyperformula'

let hfInstance = null

/** Initialize or reset the HyperFormula engine with sheet data */
export function initHF(sheetsData = {}) {
  if (hfInstance) {
    hfInstance.destroy()
  }

  // Build sheet map: { sheetName: [[row values]] }
  const sheets = {}
  for (const [name, data] of Object.entries(sheetsData)) {
    sheets[name] = data
  }

  hfInstance = HyperFormula.buildFromSheets(sheets, {
    licenseKey: 'gpl-v3',
    // Allow standard Excel-like functions
    useColumnIndex: false,
  })

  return hfInstance
}

/** Get or create the engine */
export function getHF() {
  if (!hfInstance) {
    hfInstance = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
  }
  return hfInstance
}

/**
 * Evaluate a single formula string.
 * @param {string} formula  e.g. "=SUM(A1:A10)"
 * @param {Array}  data     2D array of current sheet data
 * @returns {any}  computed value or error string
 */
export function evaluateFormula(formula, data) {
  try {
    const hf = HyperFormula.buildFromArray(data, { licenseKey: 'gpl-v3' })
    // Temporarily set cell to formula then read result
    const sheetId = hf.getSheetId('Sheet1')
    hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, formula)
    const result = hf.getCellValue({ sheet: sheetId, row: 0, col: 0 })
    hf.destroy()
    return result
  } catch (e) {
    return `#ERROR: ${e.message}`
  }
}

/**
 * Convert a 2D data array with formulas into computed values.
 * Returns a new 2D array with all formula cells resolved.
 */
export function computeSheet(data) {
  if (!data || data.length === 0) return data

  try {
    const hf = HyperFormula.buildFromArray(data, { licenseKey: 'gpl-v3' })
    const sheetId = hf.getSheetId('Sheet1')
    const result = []

    for (let r = 0; r < data.length; r++) {
      const row = []
      for (let c = 0; c < (data[r] || []).length; c++) {
        const val = hf.getCellValue({ sheet: sheetId, row: r, col: c })
        // Convert HF error objects to readable strings
        row.push(val && typeof val === 'object' && val.type ? `#${val.type}` : val)
      }
      result.push(row)
    }

    hf.destroy()
    return result
  } catch {
    return data
  }
}

/**
 * Check if a string is a formula (starts with =)
 */
export const isFormula = (val) =>
  typeof val === 'string' && val.startsWith('=')

/**
 * Parse a cell address like "B3" → { col: 1, row: 2 }
 */
export function parseCellAddress(addr) {
  const match = addr.toUpperCase().match(/^([A-Z]+)(\d+)$/)
  if (!match) return null
  const col = match[1].split('').reduce((acc, ch) => acc * 26 + ch.charCodeAt(0) - 64, 0) - 1
  const row = parseInt(match[2]) - 1
  return { col, row }
}

/**
 * Column index to letter: 0 → A, 1 → B, 26 → AA
 */
export function colIndexToLetter(index) {
  let letter = ''
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    n = Math.floor((n - 1) / 26)
  }
  return letter
}
