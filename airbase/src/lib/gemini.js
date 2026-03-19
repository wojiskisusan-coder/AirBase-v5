// src/lib/gemini.js
// ─────────────────────────────────────────────────────────
// Robust Gemini 2.0 Flash client.
// Features: timeout, retry with backoff, clean JSON parsing,
// streaming-ready structure, detailed error messages.
// ─────────────────────────────────────────────────────────

const KEY   = import.meta.env.VITE_GEMINI_API_KEY
const MODEL = 'gemini-2.0-flash'
const BASE  = 'https://generativelanguage.googleapis.com/v1beta/models'

// ── Safety: warn on missing key ──────────────────────────
if (!KEY || KEY === 'placeholder') {
  console.warn('[AirBase AI] VITE_GEMINI_API_KEY is not set. AI features will not work.')
}

// ── Fetch with timeout ───────────────────────────────────
async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out after 30s. Please try again.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ── Core call with retry ─────────────────────────────────
async function callGemini(payload, retries = 2) {
  const url = `${BASE}/${MODEL}:generateContent?key=${KEY}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        const msg = errBody?.error?.message || `HTTP ${res.status}`

        // Don't retry on auth/quota errors
        if (res.status === 400 || res.status === 403 || res.status === 404) {
          throw new Error(`Gemini API error: ${msg}`)
        }

        // Retry on 429 (rate limit) or 5xx (server error)
        if (attempt < retries) {
          await sleep(1000 * (attempt + 1))
          continue
        }
        throw new Error(`Gemini API error: ${msg}`)
      }

      const data = await res.json()

      // Blocked by safety filters
      if (data.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error('Response blocked by safety filters.')
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error('Empty response from Gemini.')
      return text

    } catch (err) {
      if (attempt === retries || err.message.includes('timed out')) throw err
      await sleep(800 * (attempt + 1))
    }
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── JSON cleaner ─────────────────────────────────────────
function toJSON(raw) {
  // Strip markdown code fences
  let clean = raw
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  // Sometimes Gemini wraps in extra text — extract first JSON object/array
  const objMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (objMatch) clean = objMatch[0]

  return JSON.parse(clean)
}

// ── Build payload ────────────────────────────────────────
function payload(systemText, userText, temp = 0.3, tokens = 4096) {
  return {
    system_instruction: { parts: [{ text: systemText }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { temperature: temp, maxOutputTokens: tokens },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  }
}

// ═══════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════

// ── 1. Table generation ──────────────────────────────────
const TABLE_SYS = `You are AirBase AI, a database table generator.
Return ONLY a raw JSON object (no markdown, no explanation):
{
  "tableName": "string",
  "columns": [
    {"key":"snake_case_id","title":"Display Name","type":"text|number|date|boolean|select","options":["opt1","opt2"]}
  ],
  "rows": [{"snake_case_id":"value"}]
}
Rules:
- Generate 8-12 realistic, diverse sample rows
- column.key must be snake_case, no spaces or special chars
- type must be exactly one of: text, number, date, boolean, select
- options array only for type=select
- dates in YYYY-MM-DD format
- numbers as numeric strings e.g. "1500" not "$1,500"
Return ONLY the JSON. No preamble.`

export async function generateTable(prompt) {
  const raw = await callGemini(payload(TABLE_SYS, prompt, 0.4, 4096))
  return toJSON(raw)
}

// ── 2. Formula generation ────────────────────────────────
const FORMULA_SYS = `You are a spreadsheet formula expert.
Convert natural language to a HyperFormula/Excel-compatible formula.
Return ONLY the formula string starting with =
No explanation, no markdown, no punctuation after the formula.
Examples:
User: sum column B → =SUM(B2:B1000)
User: average of A1 to A10 → =AVERAGE(A1:A10)
User: if value in C is greater than 100 show High else Low → =IF(C1>100,"High","Low")`

export async function generateFormula(prompt) {
  const raw = await callGemini(payload(FORMULA_SYS, prompt, 0.1, 256))
  // Extract just the formula — take first line that starts with =
  const lines = raw.trim().split('\n')
  const formula = lines.find(l => l.trim().startsWith('=')) || raw.trim()
  return formula.replace(/[`'"]/g, '').trim()
}

// ── 3. Data analysis ─────────────────────────────────────
const ANALYZE_SYS = `You are a data analyst. Analyze the spreadsheet data provided.
Structure your response with these exact sections:
📊 **Summary** — 2-3 sentence high-level overview
🔍 **Key Findings** — 3-5 bullet points of important patterns or trends
⚠️ **Anomalies** — any outliers, duplicates, or data quality issues found
💡 **Recommendations** — 3 specific, actionable next steps
Keep response under 350 words. Be specific with numbers.`

export async function analyzeData(columns, rows) {
  const data = {
    columns: columns.map(c => ({ name: c.title, type: c.type })),
    rowCount: rows.filter(r => r.some(c => c !== '' && c != null)).length,
    sample: rows.slice(0, 30).map(r => {
      const obj = {}
      columns.forEach((c, i) => { obj[c.title] = r[i] })
      return obj
    }),
  }
  return callGemini(payload(ANALYZE_SYS, JSON.stringify(data), 0.4, 1024))
}

// ── 4. Smart fill ────────────────────────────────────────
export async function smartFill(columnTitle, columnType, existingValues, count) {
  const sys = `You are a data completion AI. Fill missing spreadsheet cells intelligently.
Return ONLY a raw JSON array of ${count} values. No markdown, no explanation.
Match the pattern and style of existing values.
Example output: ["New York","Los Angeles","Chicago"]`
  const prompt = `Column: "${columnTitle}" (type: ${columnType})
Existing values sample: ${JSON.stringify(existingValues.slice(0, 15))}
Generate exactly ${count} realistic values that fit this column.`
  const raw = await callGemini(payload(sys, prompt, 0.6, 1024))
  const result = toJSON(raw)
  return Array.isArray(result) ? result : Object.values(result)
}
export { smartFill as bulkFillCells }

// ── 5. Intent router ─────────────────────────────────────
const ROUTER_SYS = `You are an intent classifier for a spreadsheet app.
Classify the user message into exactly one intent.
Return ONLY raw JSON (no markdown): {"intent":"...","response":"..."}
Intents:
- "generate_table" → user wants to create a table or dataset
- "formula" → user wants a spreadsheet formula
- "analyze" → user wants data analysis or insights
- "bulk_fill" → user wants to fill empty cells automatically  
- "chat" → general question or anything else
For "formula": response = the formula string starting with =
For "generate_table","analyze","bulk_fill": response = "ok"
For "chat": response = a helpful 1-3 sentence answer`

export async function routeCommand(message) {
  const raw = await callGemini(payload(ROUTER_SYS, message, 0.1, 256))
  return toJSON(raw)
}

// ── 6. Multi-turn chat ───────────────────────────────────
const CHAT_SYS = `You are AirBase AI, an intelligent spreadsheet and database assistant.
You are embedded in AirBase — a tool that combines Excel, Airtable, and AI.
Help users with: data organization, formula writing, database design, analysis, productivity.
Be concise (under 200 words), technical, and actionable.
Format responses with **bold** for key terms and bullet points where helpful.`

export async function chatAssistant(messages) {
  const url = `${BASE}/${MODEL}:generateContent?key=${KEY}`
  const contents = messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetchWithTimeout(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: CHAT_SYS }] },
      contents,
      generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message || `Gemini chat error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.'
}

// ── Test connection ──────────────────────────────────────
export async function testConnection() {
  try {
    const result = await callGemini(payload('Reply with only the word: ok', 'ping', 0.0, 10))
    return { ok: true, message: result.trim() }
  } catch (err) {
    return { ok: false, message: err.message }
  }
}
