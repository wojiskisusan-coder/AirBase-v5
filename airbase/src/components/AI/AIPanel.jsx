// AIPanel.jsx — Gemini AI panel with connection test + retry UI
import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Wand2, Table2, BarChart3, Zap, ChevronRight,
         RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react'
import { chatAssistant, generateTable, generateFormula,
         analyzeData, routeCommand, bulkFillCells, testConnection } from '../../lib/openai'
import { useStore } from '../../store/spreadsheetStore'
import toast from 'react-hot-toast'

const QUICK = [
  { icon: <Table2 size={10}/>,    label: 'CRM table',   text: 'Create a CRM contacts table with name, email, company, deal value, status and last contacted date' },
  { icon: <Table2 size={10}/>,    label: 'Inventory',   text: 'Product inventory with SKU, name, category, cost, price, stock' },
  { icon: <Wand2 size={10}/>,     label: 'Formula',     text: 'Sum all values in column B from row 2 to 100' },
  { icon: <BarChart3 size={10}/>, label: 'Analyze',     text: 'Analyze my dataset and give me insights' },
  { icon: <Zap size={10}/>,       label: 'AI Fill',     text: 'Fill empty cells in the selected column using AI' },
]

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);font-weight:600">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(99,102,241,0.15);padding:1px 5px;border-radius:4px;font-family:Fira Code,monospace;font-size:11px;color:var(--accent-light)">$1</code>')
    .replace(/```[\s\S]*?```/g, m => {
      const c = m.replace(/```\n?/g,'')
      return `<pre style="background:var(--bg-base);border:1px solid var(--border-strong);border-radius:10px;padding:10px;margin:6px 0;font-family:Fira Code,monospace;font-size:11px;color:var(--accent-light);overflow-x:auto">${c}</pre>`
    })
    .replace(/•\s/g, '• ')
    .replace(/\n/g, '<br/>')
}

export function AIPanel({ ss }) {
  const store     = useStore()
  const [msgs,    setMsgs]    = useState([])
  const [input,   setInput]   = useState('')
  const [busy,    setBusy]    = useState(false)
  const [aiStatus,setAIStatus]= useState('untested') // untested|ok|error
  const [testing, setTesting] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Test connection on mount
  useEffect(() => {
    const key = import.meta.env.VITE_GEMINI_API_KEY
    if (!key || key === 'placeholder') {
      setAIStatus('error')
      setMsgs([{ role:'assistant', content:'⚠️ **Gemini API key not configured.**\n\nPlease add `VITE_GEMINI_API_KEY` to your Vercel environment variables and redeploy.' }])
    } else {
      setMsgs([{ role:'assistant', content:'Hi! I\'m **AirBase AI** powered by Gemini 2.0.\n\nAsk me to **generate tables**, **write formulas**, **analyze data**, or anything about your spreadsheet.' }])
      // Test silently in background
      testConnection().then(r => setAIStatus(r.ok ? 'ok' : 'error'))
    }
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const handleTest = async () => {
    setTesting(true)
    const r = await testConnection()
    setAIStatus(r.ok ? 'ok' : 'error')
    setTesting(false)
    toast[r.ok ? 'success' : 'error'](r.ok ? 'Gemini connected!' : `Error: ${r.message}`)
  }

  const send = async (text = input) => {
    const msg = text.trim()
    if (!msg || busy) return
    setInput('')
    setMsgs(p => [...p, { role:'user', content:msg }])
    setBusy(true)

    try {
      const routed = await routeCommand(msg)

      if (routed.intent === 'generate_table') {
        setMsgs(p => [...p, { role:'assistant', content:'Building your table…', temp:true }])
        const result = await generateTable(msg)
        await ss.applyAITable(result)
        setMsgs(p => [...p.filter(m=>!m.temp), {
          role:'assistant',
          content:`✅ **"${result.tableName}"** created!\n\n**${result.columns.length} columns:** ${result.columns.map(c=>c.title).join(', ')}\n**${result.rows.length} rows** of sample data.`
        }])

      } else if (routed.intent === 'formula') {
        const formula = await generateFormula(msg)
        setMsgs(p => [...p, { role:'assistant', content:`Formula ready:\n\`\`\`\n${formula}\n\`\`\``, formula }])

      } else if (routed.intent === 'analyze') {
        setMsgs(p => [...p, { role:'assistant', content:'Analyzing your dataset…', temp:true }])
        const analysis = await analyzeData(store.columns, store.gridData)
        setMsgs(p => [...p.filter(m=>!m.temp), { role:'assistant', content:analysis }])

      } else if (routed.intent === 'bulk_fill') {
        const { row, col } = store.selectedCell
        const colMeta   = store.columns[col]
        const existing  = store.gridData.map(r=>r[col]).filter(v=>v!==''&&v!=null)
        const emptyIdxs = store.gridData.map((r,i)=>(r[col]===''||r[col]==null)?i:null).filter(v=>v!==null)
        if (emptyIdxs.length === 0) {
          setMsgs(p => [...p, { role:'assistant', content:'No empty cells found in the selected column.' }])
        } else {
          setMsgs(p => [...p, { role:'assistant', content:`Filling ${emptyIdxs.length} empty cells in **"${colMeta?.title}"**…`, temp:true }])
          const fills = await bulkFillCells(colMeta?.title, colMeta?.type, existing, emptyIdxs.length)
          fills.forEach((val, i) => { if(emptyIdxs[i]!=null) ss.handleCellChange(emptyIdxs[i], col, String(val)) })
          setMsgs(p => [...p.filter(m=>!m.temp), { role:'assistant', content:`✅ Filled **${fills.length} cells** in "${colMeta?.title}".` }])
        }

      } else {
        const history = msgs.slice(-6).map(m=>({ role:m.role, content:m.content }))
        const reply   = await chatAssistant([...history, { role:'user', content:msg }])
        setMsgs(p => [...p, { role:'assistant', content:reply }])
      }

      setAIStatus('ok')
    } catch (err) {
      setMsgs(p => [...p.filter(m=>!m.temp), {
        role:'assistant',
        content:`❌ **Error:** ${err.message}\n\nPlease check your Gemini API key in Vercel settings.`
      }])
      setAIStatus('error')
      toast.error('AI request failed')
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const applyFormula = formula => {
    const {row,col} = store.selectedCell
    ss.handleCellChange(row, col, formula)
    toast.success(`Applied to ${String.fromCharCode(65+col)}${row+1}`)
  }

  if (!store.aiPanelOpen) return null

  const statusConfig = {
    untested: { label:'Connecting', cls:'badge-indigo', icon:<RefreshCw size={9} className="animate-spin"/> },
    ok:       { label:'Ready',      cls:'badge-green',  icon:<Wifi size={9}/> },
    error:    { label:'Error',      cls:'badge-red',    icon:<WifiOff size={9}/> },
  }
  const sc = statusConfig[aiStatus]

  return (
    <div className="w-72 flex flex-col shrink-0 animate-fade-right tablet-hide" style={{
      background:'var(--bg-surface)',borderLeft:'1px solid var(--border)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{borderBottom:'1px solid var(--border)'}}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',boxShadow:'0 0 12px rgba(79,70,229,0.35)'}}>
            <Bot size={14} color="white"/>
          </div>
          <div>
            <p className="text-xs font-bold" style={{color:'var(--text-primary)'}}>AI Assistant</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`badge ${sc.cls} flex items-center gap-1`} style={{padding:'1px 6px',fontSize:9}}>
                {sc.icon}{sc.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {aiStatus === 'error' && (
            <button onClick={handleTest} disabled={testing}
              className="fmt-btn" title="Test Gemini connection">
              <RefreshCw size={12} className={testing?'animate-spin':''}/>
            </button>
          )}
          <button onClick={store.toggleAI} className="fmt-btn"><X size={13}/></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'} animate-fade-up`}>
            {m.role==='assistant'&&(
              <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mr-1.5 mt-0.5"
                style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',flexShrink:0}}>
                <Bot size={10} color="white"/>
              </div>
            )}
            <div className={`max-w-[88%] px-3 py-2 text-xs leading-relaxed ${m.role==='user'?'ai-message-user':'ai-message-ai'}`}
              style={{color:m.role==='user'?'white':'var(--text-secondary)'}}>
              <span dangerouslySetInnerHTML={{__html:renderMd(m.content)}}/>
              {m.formula && m.role==='assistant' && (
                <button onClick={()=>applyFormula(m.formula)}
                  className="mt-2 w-full text-xs px-2 py-1.5 rounded-lg text-center flex items-center justify-center gap-1 transition-all"
                  style={{background:'rgba(99,102,241,0.15)',border:'1px solid var(--border-strong)',color:'var(--accent-light)'}}>
                  <ChevronRight size={11}/> Apply to selected cell
                </button>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex items-end gap-1.5">
            <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
              style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)'}}>
              <Bot size={10} color="white"/>
            </div>
            <div className="ai-message-ai px-4 py-3 ai-thinking">
              <div className="flex gap-1.5">
                {[0,1,2].map(i=>(
                  <div key={i} className="w-1.5 h-1.5 rounded-full"
                    style={{background:'var(--accent)',animation:`floatDot 1.2s ease-in-out ${i*0.2}s infinite`}}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Quick actions */}
      <div className="px-3 pb-2 pt-1" style={{borderTop:'1px solid var(--border)'}}>
        <p className="text-[9px] uppercase tracking-wider font-semibold mb-1.5" style={{color:'var(--text-faint)'}}>Quick</p>
        <div className="flex flex-wrap gap-1">
          {QUICK.map(q=>(
            <button key={q.label} onClick={()=>send(q.text)} disabled={busy||aiStatus==='error'}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-all disabled:opacity-30"
              style={{background:'var(--bg-hover)',border:'1px solid var(--border)',color:'var(--text-muted)'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.color='var(--accent-light)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)'}}>
              {q.icon}{q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3" style={{borderTop:'1px solid var(--border)'}}>
        <div className="flex gap-2">
          <input ref={inputRef} value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
            disabled={busy||aiStatus==='error'}
            placeholder={aiStatus==='error'?'Check API key in Vercel settings…':'Ask anything…'}
            className="flex-1 text-xs rounded-xl px-3 py-2.5 outline-none"
            style={{background:'var(--bg-hover)',border:'1px solid var(--border)',color:'var(--text-primary)'}}
            onFocus={e=>e.target.style.borderColor='var(--accent)'}
            onBlur={e=>e.target.style.borderColor='var(--border)'}
          />
          <button onClick={()=>send()} disabled={busy||!input.trim()||aiStatus==='error'}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30 hover:scale-105"
            style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',boxShadow:'0 2px 12px rgba(79,70,229,0.35)'}}>
            {busy ? <RefreshCw size={13} className="animate-spin"/> : <Send size={13}/>}
          </button>
        </div>
        {aiStatus === 'error' && (
          <button onClick={handleTest} disabled={testing}
            className="w-full mt-2 text-xs py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'var(--danger)'}}>
            {testing?<RefreshCw size={11} className="animate-spin"/>:<AlertCircle size={11}/>}
            {testing?'Testing connection…':'Retry connection'}
          </button>
        )}
      </div>
    </div>
  )
}
