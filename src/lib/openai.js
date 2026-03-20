// src/lib/openai.js — re-exports from gemini.js (backward compatibility)
export {
  generateTable,
  generateFormula,
  analyzeData,
  smartFill,
  smartFill as bulkFillCells,
  routeCommand,
  chatAssistant,
  testConnection,
} from './gemini.js'
