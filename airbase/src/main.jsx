import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'
import { applyTheme, getStoredTheme } from './lib/theme'

// Apply theme immediately before first render — no flash
applyTheme(getStoredTheme())

const App = lazy(() => import('./App.jsx'))

function Splash() {
  return (
    <div className="flex items-center justify-center h-full" style={{background:'var(--bg-base)'}}>
      <div className="app-bg"/>
      <div className="text-center relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{background:'linear-gradient(135deg,var(--accent-dark),#7C3AED)',boxShadow:'0 8px 40px rgba(79,70,229,0.45)'}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
          </svg>
        </div>
        <p className="text-sm font-bold" style={{color:'var(--text-primary)'}}>AirBase</p>
        <p className="text-xs mt-1" style={{color:'var(--text-muted)'}}>AI-Powered Database</p>
        <div className="flex justify-center gap-1.5 mt-5">
          {[0,1,2].map(i=>(
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{background:'var(--accent)',animation:`floatDot 1.2s ease-in-out ${i*0.2}s infinite`}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Splash/>}>
      <App/>
    </Suspense>
  </React.StrictMode>
)
