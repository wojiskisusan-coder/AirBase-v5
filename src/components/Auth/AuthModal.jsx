import { useState } from 'react'
import { auth } from '../../lib/supabase'
import { Database, Table2, Bot, LogIn, UserPlus, Eye, EyeOff, Sun, Moon } from 'lucide-react'
import { applyTheme, getStoredTheme } from '../../lib/theme'
import toast from 'react-hot-toast'

export function AuthModal() {
  const [mode,    setMode]   = useState('signin')
  const [email,   setEmail]  = useState('')
  const [pass,    setPass]   = useState('')
  const [showPw,  setShowPw] = useState(false)
  const [loading, setLoading]= useState(false)
  const [theme,   setTheme]  = useState(getStoredTheme)

  const toggleTheme = () => {
    const next = theme==='dark'?'light':'dark'
    setTheme(next); applyTheme(next)
  }

  const handle = async e => {
    e.preventDefault()
    if(!email||!pass) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const {error} = await (mode==='signin'?auth.signIn:auth.signUp)(email,pass)
      if(error) throw error
      if(mode==='signup') toast.success('Account created! Check your email if confirmation is required.')
    } catch(err){ toast.error(err.message) }
    finally{ setLoading(false) }
  }

  return(
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{background:'var(--bg-base)'}}>
      <div className="app-bg"/>

      {/* Theme toggle top right */}
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 z-10 fmt-btn" title="Toggle theme"
        style={{background:'var(--bg-card)',border:'1px solid var(--border)',width:36,height:36,borderRadius:10}}>
        {theme==='dark'?<Sun size={15}/>:<Moon size={15}/>}
      </button>

      {/* Orbs */}
      <div className="fixed rounded-full pointer-events-none" style={{
        width:480,height:480,top:'-8%',left:'8%',
        background:'radial-gradient(circle,rgba(79,70,229,0.1) 0%,transparent 70%)',filter:'blur(60px)'
      }}/>
      <div className="fixed rounded-full pointer-events-none" style={{
        width:360,height:360,bottom:'5%',right:'8%',
        background:'radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)',filter:'blur(60px)'
      }}/>

      <div className="relative w-full max-w-sm animate-scale-in z-10" style={{
        background:'var(--bg-card)',border:'1px solid var(--border-strong)',
        borderRadius:24,boxShadow:'var(--shadow-panel)',padding:'36px 32px',
      }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',boxShadow:'0 8px 40px rgba(79,70,229,0.45)'}}>
            <Database size={28} color="white"/>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{color:'var(--text-primary)'}}>AirBase</h1>
          <p className="text-xs font-bold mt-1 uppercase tracking-widest" style={{color:'var(--accent)'}}>AI-Powered Database</p>
        </div>

        <p className="text-sm font-medium text-center mb-5" style={{color:'var(--text-muted)'}}>
          {mode==='signin'?'Welcome back':'Create your workspace'}
        </p>

        <form onSubmit={handle} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'var(--text-muted)'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
              className="input-base" placeholder="you@example.com" autoComplete="email"/>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{color:'var(--text-muted)'}}>Password</label>
            <div className="relative">
              <input type={showPw?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)}
                className="input-base pr-10" placeholder="••••••••"
                autoComplete={mode==='signin'?'current-password':'new-password'}/>
              <button type="button" onClick={()=>setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{color:'var(--text-muted)'}}>
                {showPw?<EyeOff size={14}/>:<Eye size={14}/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 mt-2 transition-all hover:scale-[1.01]"
            style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',boxShadow:'0 4px 24px rgba(79,70,229,0.4)',opacity:loading?.7:1}}>
            {loading
              ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{borderColor:'rgba(255,255,255,0.3)',borderTopColor:'white'}}/>
              : mode==='signin'
                ? <><LogIn size={14}/>Sign In</>
                : <><UserPlus size={14}/>Create Account</>
            }
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{background:'var(--border)'}}/>
          <span className="text-xs" style={{color:'var(--text-faint)'}}>or</span>
          <div className="flex-1 h-px" style={{background:'var(--border)'}}/>
        </div>

        <p className="text-center text-xs" style={{color:'var(--text-muted)'}}>
          {mode==='signin'?"Don't have an account? ":"Already have an account? "}
          <button onClick={()=>setMode(mode==='signin'?'signup':'signin')}
            className="font-bold hover:underline" style={{color:'var(--accent-light)'}}>
            {mode==='signin'?'Sign up free':'Sign in'}
          </button>
        </p>

        {/* Feature row */}
        <div className="flex gap-2 mt-6">
          {[{icon:<Table2 size={13}/>,t:'Spreadsheet'},{icon:<Database size={13}/>,t:'Database'},{icon:<Bot size={13}/>,t:'Gemini AI'}].map(f=>(
            <div key={f.t} className="flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl"
              style={{background:'var(--bg-hover)',border:'1px solid var(--border)'}}>
              <div style={{color:'var(--accent)'}}>{f.icon}</div>
              <p className="text-[10px] font-semibold" style={{color:'var(--text-secondary)'}}>{f.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
