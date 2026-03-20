// components/Import/importExport.js
// ─────────────────────────────────────────────────────────
// CSV import / CSV+XLSX export utilities.
// All operations are client-side (no server round-trip).
// ─────────────────────────────────────────────────────────
import Papa  from 'papaparse'
import * as XLSX from 'xlsx'

// ── CSV Import ────────────────────────────────────────────
/**
 * Parse a CSV File object into { columns, gridData }.
 * @param {File} file
 * @returns {Promise<{ columns: Array, gridData: Array }>}
 */
export function importCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header:        true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields || []

        const columns = headers.map((h, i) => ({
          key:   `col_${i}`,
          title: h,
          type:  inferColumnType(result.data, h),
          width: Math.max(100, h.length * 9),
        }))

        const gridData = result.data.map((row) =>
          columns.map((c) => row[c.title] ?? '')
        )

        // Pad to at least 50 rows
        while (gridData.length < 50) {
          gridData.push(Array(columns.length).fill(''))
        }

        resolve({ columns, gridData })
      },
      error: (err) => reject(err),
    })
  })
}

/** Infer column type from sample data */
function inferColumnType(rows, header) {
  const samples = rows.slice(0, 20).map((r) => r[header]).filter(Boolean)
  if (samples.length === 0) return 'text'

  const allNumbers = samples.every((v) => !isNaN(parseFloat(v)) && isFinite(v))
  if (allNumbers) return 'number'

  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/
  const allDates    = samples.every((v) => datePattern.test(String(v)))
  if (allDates) return 'date'

  const boolVals = ['true', 'false', 'yes', 'no', '1', '0']
  const allBool  = samples.every((v) => boolVals.includes(String(v).toLowerCase()))
  if (allBool) return 'boolean'

  return 'text'
}

// ── CSV Export ────────────────────────────────────────────
/**
 * Export current sheet as a .csv file download.
 * @param {Array} columns   - column metadata
 * @param {Array} gridData  - 2D array of values
 * @param {string} sheetName
 */
export function exportCSV(columns, gridData, sheetName = 'Sheet') {
  const headers = columns.map((c) => c.title)
  const rows    = gridData
    .filter((row) => row.some((cell) => cell !== '' && cell != null))
    .map((row) => {
      const obj = {}
      columns.forEach((c, i) => { obj[c.title] = row[i] ?? '' })
      return obj
    })

  const csv  = Papa.unparse({ fields: headers, data: rows })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${sheetName}.csv`)
}

// ── XLSX Export ───────────────────────────────────────────
/**
 * Export current sheet as a .xlsx file download.
 */
export function exportXLSX(columns, gridData, sheetName = 'Sheet') {
  const headers = columns.map((c) => c.title)
  const rows    = gridData
    .filter((row) => row.some((cell) => cell !== '' && cell != null))
    .map((row) => columns.map((_, i) => row[i] ?? ''))

  const wsData  = [headers, ...rows]
  const ws      = XLSX.utils.aoa_to_sheet(wsData)

  // Style header row (bold)
  headers.forEach((_, i) => {
    const cell = XLSX.utils.encode_cell({ c: i, r: 0 })
    if (ws[cell]) ws[cell].s = { font: { bold: true } }
  })

  // Auto column widths
  ws['!cols'] = headers.map((h, i) => ({
    wch: Math.max(
      h.length,
      ...rows.slice(0, 20).map((r) => String(r[i] ?? '').length)
    ) + 2
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
  XLSX.writeFile(wb, `${sheetName}.xlsx`)
}

// ── Helper ────────────────────────────────────────────────
function triggerDownload(blob, filename) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
