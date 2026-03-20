// DataHealthPanel.jsx — UNIQUE FEATURE: Live data quality score + issues
import { useMemo } from 'react'
import { useStore } from '../../store/spreadsheetStore'
import { ShieldCheck, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'

export function DataHealthPanel({ onClose }) {
  const store = useStore()

  const health = useMemo(()=>{
    const rows   = store.gridData.filter(r=>r.some(c=>c!==''&&c!=null))
    const total  = rows.length * store.columns.length
    if(total===0) return null

    let empty=0, dupes=0, typeErrors=0, issues=[]
    const seen = new Set()

    rows.forEach((row,ri)=>{
      const key = row.join('|')
      if(seen.has(key)){dupes++;issues.push({type:'dupe',row:ri+1,msg:'Duplicate row'})}
      seen.add(key)

      row.forEach((cell,ci)=>{
        const col = store.columns[ci]
        if(cell===''||cell==null){
          empty++
          if(ci<3) issues.push({type:'empty',row:ri+1,col:col?.title,msg:`Empty cell in "${col?.title}"`})
        } else if(col?.type==='number'&&isNaN(parseFloat(cell))){
          typeErrors++
          issues.push({type:'type',row:ri+1,col:col?.title,msg:`"${cell}" is not a number in "${col?.title}"`})
        } else if(col?.type==='date'&&isNaN(Date.parse(cell))){
          typeErrors++
          issues.push({type:'type',row:ri+1,col:col?.title,msg:`"${cell}" is not a valid date in "${col?.title}"`})
        }
      })
    })

    const score = Math.max(0,100-Math.round((empty/total)*40)-Math.min(30,dupes*10)-Math.min(30,typeErrors*5))
    const color = score>=80?'#34D399':score>=50?'#FBBF24':'#F87171'

    return {score,color,empty,dupes,typeErrors,total,rows:rows.length,issues:issues.slice(0,20)}
  },[store.gridData,store.columns])

  if(!health) return(
    <div className="row-detail-panel flex flex-col items-center justify-center p-8 text-center">
      <ShieldCheck size={40} className="mb-4 opacity-20"/>
      <p style={{color:'#334155'}}>No data to analyze</p>
      <button onClick={onClose} className="mt-4 toolbar-btn">Close</button>
    </div>
  )

  const {score,color,empty,dupes,typeErrors,total,rows,issues} = health

  return(
    <div className="row-detail-panel flex flex-col">
      <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} color="#6366F1"/>
          <h3 className="font-semibold text-sm text-white">Data Health</h3>
        </div>
        <button onClick={onClose} className="fmt-btn"><XCircle size={13}/></button>
      </div>

      {/* Score ring */}
      <div className="flex flex-col items-center py-8 px-5">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score*3.14} 314`}
              style={{transition:'stroke-dasharray .8s cubic-bezier(.16,1,.3,1)'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black" style={{color}}>{score}</span>
            <span className="text-xs font-semibold" style={{color:'#475569'}}>/ 100</span>
          </div>
        </div>
        <p className="text-sm font-semibold" style={{color}}>
          {score>=80?'Excellent':'score>=50'?'Needs attention':'Poor quality'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-4">
        {[
          {label:'Rows',value:rows,icon:<TrendingUp size={12}/>,color:'#818CF8'},
          {label:'Empty',value:empty,icon:<AlertTriangle size={12}/>,color:empty>0?'#FBBF24':'#34D399'},
          {label:'Type errors',value:typeErrors,icon:<XCircle size={12}/>,color:typeErrors>0?'#F87171':'#34D399'},
          {label:'Duplicates',value:dupes,icon:<AlertTriangle size={12}/>,color:dupes>0?'#FBBF24':'#34D399'},
          {label:'Completeness',value:`${Math.round(((total-empty)/total)*100)}%`,icon:<ShieldCheck size={12}/>,color:'#818CF8'},
          {label:'Columns',value:store.columns.length,icon:<TrendingUp size={12}/>,color:'#818CF8'},
        ].map(({label,value,icon,color:c})=>(
          <div key={label} className="rounded-xl p-3 text-center" style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex justify-center mb-1" style={{color:c}}>{icon}</div>
            <p className="text-sm font-bold" style={{color:c}}>{value}</p>
            <p className="text-[10px] mt-0.5" style={{color:'#334155'}}>{label}</p>
          </div>
        ))}
      </div>

      {/* Issues */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{color:'#334155'}}>
          Issues ({issues.length})
        </p>
        {issues.length===0?
          <div className="flex items-center gap-2 py-3" style={{color:'#34D399'}}>
            <ShieldCheck size={14}/><span className="text-xs">No issues found — great data!</span>
          </div>
        :issues.map((iss,i)=>(
          <div key={i} className="flex items-start gap-2 py-2 text-xs animate-fade-up"
            style={{borderBottom:'1px solid rgba(255,255,255,0.04)',animationDelay:`${i*20}ms`}}>
            {iss.type==='empty'&&<AlertTriangle size={12} className="shrink-0 mt-0.5" color="#FBBF24"/>}
            {iss.type==='dupe'&&<AlertTriangle size={12} className="shrink-0 mt-0.5" color="#F87171"/>}
            {iss.type==='type'&&<XCircle size={12} className="shrink-0 mt-0.5" color="#F87171"/>}
            <div>
              <span className="font-mono px-1 rounded text-[10px] mr-1" style={{background:'rgba(99,102,241,0.15)',color:'#818CF8'}}>Row {iss.row}</span>
              <span style={{color:'#94A3B8'}}>{iss.msg}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
