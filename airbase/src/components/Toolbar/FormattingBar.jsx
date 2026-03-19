// FormattingBar.jsx — Rich text formatting toolbar with Lucide icons
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
         Paintbrush, Highlighter, Type, Minus } from 'lucide-react'
import { useStore } from '../../store/spreadsheetStore'

const FONT_SIZES = [10,11,12,13,14,16,18,20,24,28,32]
const TEXT_COLORS = [
  {label:'Default',  val:''},
  {label:'White',    val:'#F8FAFC'},
  {label:'Indigo',   val:'#818CF8'},
  {label:'Green',    val:'#34D399'},
  {label:'Amber',    val:'#FBBF24'},
  {label:'Red',      val:'#F87171'},
  {label:'Pink',     val:'#F472B6'},
  {label:'Cyan',     val:'#22D3EE'},
]
const BG_COLORS = [
  {label:'None',     val:''},
  {label:'Indigo',   val:'rgba(99,102,241,0.25)'},
  {label:'Green',    val:'rgba(52,211,153,0.2)'},
  {label:'Amber',    val:'rgba(251,191,36,0.2)'},
  {label:'Red',      val:'rgba(239,68,68,0.2)'},
  {label:'Purple',   val:'rgba(167,139,250,0.2)'},
]

export function FormattingBar({ ss }) {
  const store = useStore()
  const { row, col } = store.selectedCell
  const fmt = store.cellFormats[`${row}_${col}`] || {}

  const toggle = (key) => ss.updateCellFormat(row, col, { [key]: !fmt[key] })
  const set    = (key, val) => ss.updateCellFormat(row, col, { [key]: val })

  return (
    <div className="fmt-bar">
      {/* Font size */}
      <select className="fmt-select w-14 mr-1" value={fmt.fontSize||13}
        onChange={(e) => set('fontSize', Number(e.target.value))}>
        {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <div className="fmt-sep" />

      {/* Bold / Italic / Underline */}
      <FmtBtn on={fmt.bold}      onClick={() => toggle('bold')}      tip="Bold (Ctrl+B)">
        <Bold size={13} strokeWidth={2.5}/>
      </FmtBtn>
      <FmtBtn on={fmt.italic}    onClick={() => toggle('italic')}    tip="Italic (Ctrl+I)">
        <Italic size={13} strokeWidth={2.5}/>
      </FmtBtn>
      <FmtBtn on={fmt.underline} onClick={() => toggle('underline')} tip="Underline (Ctrl+U)">
        <Underline size={13} strokeWidth={2.5}/>
      </FmtBtn>

      <div className="fmt-sep" />

      {/* Alignment */}
      <FmtBtn on={fmt.align==='left'||!fmt.align}   onClick={() => set('align','left')}   tip="Align Left">
        <AlignLeft size={13}/>
      </FmtBtn>
      <FmtBtn on={fmt.align==='center'} onClick={() => set('align','center')} tip="Align Center">
        <AlignCenter size={13}/>
      </FmtBtn>
      <FmtBtn on={fmt.align==='right'}  onClick={() => set('align','right')}  tip="Align Right">
        <AlignRight size={13}/>
      </FmtBtn>

      <div className="fmt-sep" />

      {/* Text color */}
      <div className="relative group" data-tip="Text Color">
        <button className="fmt-btn flex items-center gap-1">
          <Type size={12}/>
          <div className="w-3 h-1 rounded-full mt-0.5" style={{background:fmt.color||'#CBD5E1'}}/>
        </button>
        <div className="absolute top-full left-0 mt-1 p-2 ctx-menu hidden group-hover:flex flex-wrap gap-1" style={{minWidth:120}}>
          {TEXT_COLORS.map(c => (
            <div key={c.val} className={`color-swatch ${fmt.color===c.val?'selected':''}`}
              style={{background:c.val||'rgba(255,255,255,0.15)',width:18,height:18}}
              title={c.label} onClick={() => set('color', c.val)}/>
          ))}
        </div>
      </div>

      {/* Cell background */}
      <div className="relative group" data-tip="Cell Background">
        <button className="fmt-btn flex items-center gap-1">
          <Highlighter size={12}/>
          <div className="w-3 h-1 rounded-full mt-0.5" style={{background:fmt.bg||'transparent',border:'1px solid rgba(255,255,255,0.15)'}}/>
        </button>
        <div className="absolute top-full left-0 mt-1 p-2 ctx-menu hidden group-hover:flex flex-wrap gap-1" style={{minWidth:100}}>
          {BG_COLORS.map(c => (
            <div key={c.val} className={`color-swatch ${fmt.bg===c.val?'selected':''}`}
              style={{background:c.val||'rgba(255,255,255,0.06)',width:18,height:18}}
              title={c.label} onClick={() => set('bg', c.val)}/>
          ))}
        </div>
      </div>

      <div className="fmt-sep" />

      {/* Clear formatting */}
      <FmtBtn onClick={() => ss.updateCellFormat(row, col, {bold:false,italic:false,underline:false,color:'',bg:'',fontSize:13,align:'left'})} tip="Clear Formatting">
        <Minus size={12}/>
      </FmtBtn>
    </div>
  )
}

function FmtBtn({ children, on, onClick, tip }) {
  return (
    <button className={`fmt-btn ${on ? 'on' : ''}`} onClick={onClick} data-tip={tip}>
      {children}
    </button>
  )
}
