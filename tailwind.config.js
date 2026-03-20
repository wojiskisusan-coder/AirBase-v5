/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#6366F1', dark: '#4F46E5', light: '#818CF8', xlight: '#C7D2FE' },
        surface:  { DEFAULT: '#0F0F1E', alt: '#141428', card: '#1A1A2E', border: 'rgba(255,255,255,0.07)' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(99,102,241,0.3)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
