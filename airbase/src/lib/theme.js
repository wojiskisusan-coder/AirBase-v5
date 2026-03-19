// src/lib/theme.js — Dark/Light theme system with CSS variables
export const THEMES = {
  dark: {
    name: 'dark',
    '--bg-base':       '#080812',
    '--bg-surface':    '#0F0F1E',
    '--bg-card':       '#141428',
    '--bg-hover':      'rgba(255,255,255,0.04)',
    '--border':        'rgba(255,255,255,0.07)',
    '--border-strong': 'rgba(99,102,241,0.3)',
    '--text-primary':  '#E2E8F0',
    '--text-secondary':'#94A3B8',
    '--text-muted':    '#475569',
    '--text-faint':    '#1E293B',
    '--accent':        '#6366F1',
    '--accent-dark':   '#4F46E5',
    '--accent-light':  '#818CF8',
    '--accent-xlight': '#C7D2FE',
    '--success':       '#34D399',
    '--warning':       '#FBBF24',
    '--danger':        '#F87171',
    '--gradient-mesh': 'radial-gradient(ellipse 100% 60% at 10% -10%,rgba(99,102,241,0.18) 0%,transparent 55%),radial-gradient(ellipse 70% 50% at 90% 110%,rgba(139,92,246,0.14) 0%,transparent 55%),#080812',
    '--glass-bg':      'rgba(255,255,255,0.03)',
    '--glass-border':  'rgba(255,255,255,0.07)',
    '--ht-bg':         '#080812',
    '--ht-header-bg':  'linear-gradient(180deg,#111128 0%,#0D0D22 100%)',
    '--ht-header-color':'#6366F1',
    '--ht-cell-color': '#CBD5E1',
    '--ht-border':     'rgba(255,255,255,0.04)',
    '--ht-hover':      'rgba(99,102,241,0.05)',
    '--ht-selected':   'rgba(99,102,241,0.12)',
    '--scrollbar':     'rgba(99,102,241,0.25)',
    '--shadow-card':   '0 4px 24px rgba(0,0,0,0.4)',
    '--shadow-panel':  '0 20px 60px rgba(0,0,0,0.6)',
  },
  light: {
    name: 'light',
    '--bg-base':       '#F8F9FE',
    '--bg-surface':    '#FFFFFF',
    '--bg-card':       '#F1F3FC',
    '--bg-hover':      'rgba(99,102,241,0.05)',
    '--border':        'rgba(99,102,241,0.12)',
    '--border-strong': 'rgba(99,102,241,0.35)',
    '--text-primary':  '#0F172A',
    '--text-secondary':'#475569',
    '--text-muted':    '#94A3B8',
    '--text-faint':    '#CBD5E1',
    '--accent':        '#4F46E5',
    '--accent-dark':   '#3730A3',
    '--accent-light':  '#6366F1',
    '--accent-xlight': '#818CF8',
    '--success':       '#059669',
    '--warning':       '#D97706',
    '--danger':        '#DC2626',
    '--gradient-mesh': 'radial-gradient(ellipse 100% 60% at 10% -10%,rgba(99,102,241,0.08) 0%,transparent 55%),radial-gradient(ellipse 70% 50% at 90% 110%,rgba(139,92,246,0.06) 0%,transparent 55%),#F8F9FE',
    '--glass-bg':      'rgba(255,255,255,0.8)',
    '--glass-border':  'rgba(99,102,241,0.15)',
    '--ht-bg':         '#FFFFFF',
    '--ht-header-bg':  'linear-gradient(180deg,#EEF0FD 0%,#E8EBF9 100%)',
    '--ht-header-color':'#4F46E5',
    '--ht-cell-color': '#0F172A',
    '--ht-border':     'rgba(99,102,241,0.08)',
    '--ht-hover':      'rgba(99,102,241,0.04)',
    '--ht-selected':   'rgba(99,102,241,0.1)',
    '--scrollbar':     'rgba(99,102,241,0.2)',
    '--shadow-card':   '0 4px 24px rgba(99,102,241,0.08)',
    '--shadow-panel':  '0 20px 60px rgba(99,102,241,0.12)',
  },
}

export function applyTheme(name) {
  const theme = THEMES[name] || THEMES.dark
  const root  = document.documentElement
  Object.entries(theme).forEach(([k, v]) => {
    if (k !== 'name') root.style.setProperty(k, v)
  })
  root.setAttribute('data-theme', name)
  localStorage.setItem('airbase-theme', name)
}

export function getStoredTheme() {
  const stored = localStorage.getItem('airbase-theme')
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
