# AirBase — AI-Powered Database Application

> Excel-like spreadsheet · Airtable-like database · GPT-powered intelligence

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        AirBase MVP                          │
├──────────┬──────────────────────────────┬───────────────────┤
│ Sidebar  │      Spreadsheet Grid        │    AI Panel       │
│ (Sheets) │  ┌────────────────────────┐  │  ┌─────────────┐  │
│          │  │    Formula Bar (fx)    │  │  │  Chat UI    │  │
│ • Sheet 1│  ├────────────────────────┤  │  │  Quick Acts │  │
│ • Sheet 2│  │  Handsontable Grid     │  │  │  Messages   │  │
│ + New    │  │  + HyperFormula Engine │  │  │  Input Bar  │  │
│          │  ├────────────────────────┤  │  └─────────────┘  │
│          │  │     Status Bar         │  │                   │
└──────────┴──└────────────────────────┘──┴───────────────────┘
                         │                        │
              ┌──────────▼──────────┐   ┌─────────▼─────────┐
              │  Supabase Backend   │   │   OpenAI GPT-4o   │
              │  • Auth (JWT)       │   │   • generateTable  │
              │  • Postgres + JSONB │   │   • generateFormula│
              │  • Realtime WS      │   │   • analyzeData    │
              │  • File Storage     │   │   • routeCommand   │
              └─────────────────────┘   └───────────────────┘
```

## Tech Stack

| Layer             | Technology         | Purpose                              |
|-------------------|--------------------|--------------------------------------|
| UI Framework      | React 18           | Component rendering                  |
| Spreadsheet Grid  | Handsontable 14    | Excel-like editable grid             |
| Formula Engine    | HyperFormula 2     | =SUM, =IF, =VLOOKUP formula support  |
| State Management  | Zustand            | Global app state                     |
| Backend / Auth    | Supabase           | Postgres DB, Auth, Realtime, Storage |
| AI Layer          | OpenAI GPT-4o-mini | Table gen, formula gen, analysis     |
| Import/Export     | PapaParse + SheetJS| CSV/XLSX import and export           |
| Build Tool        | Vite               | Fast dev server and bundler          |
| Styling           | Tailwind CSS       | Utility-first dark theme             |

---

## Setup Instructions

### 1. Clone & Install

```bash
git clone <your-repo>
cd airbase
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENAI_API_KEY=sk-proj-your-openai-key
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Paste and run the contents of `supabase-schema.sql`
4. Enable Realtime:  
   `Database → Replication → supabase_realtime → Enable for sheets table`
5. (Optional) Create storage bucket `attachments` in Storage tab

### 4. Run Dev Server

```bash
npm run dev
```

Open `http://localhost:5173`

---

## Project Structure

```
airbase/
├── src/
│   ├── lib/
│   │   ├── supabase.js          # Supabase client + DB/auth helpers
│   │   ├── openai.js            # OpenAI API wrapper (table/formula/analysis)
│   │   └── hyperformula.js      # Formula engine utilities
│   ├── store/
│   │   └── spreadsheetStore.js  # Zustand global state
│   ├── hooks/
│   │   ├── useSpreadsheet.js    # Core spreadsheet business logic
│   │   └── useRealtime.js       # Supabase realtime subscription
│   ├── components/
│   │   ├── Auth/
│   │   │   └── AuthModal.jsx    # Sign-in / sign-up gate
│   │   ├── Toolbar/
│   │   │   └── Toolbar.jsx      # Top app bar + controls
│   │   ├── Sidebar/
│   │   │   └── Sidebar.jsx      # Sheet list panel
│   │   ├── Grid/
│   │   │   ├── SpreadsheetGrid.jsx   # Handsontable wrapper
│   │   │   ├── FormulaBar.jsx        # Excel-style formula bar
│   │   │   ├── ColumnTypeSelector.jsx# Column type editor
│   │   │   └── StatusBar.jsx         # Bottom aggregate bar
│   │   ├── AI/
│   │   │   └── AIPanel.jsx      # AI chat assistant panel
│   │   └── Import/
│   │       └── importExport.js  # CSV/XLSX utilities
│   ├── styles/
│   │   └── main.css             # Global + Handsontable dark theme
│   ├── App.jsx                  # Root layout + auth orchestration
│   └── main.jsx                 # React DOM entry point
├── supabase-schema.sql          # Database schema + RLS policies
├── .env.example                 # Environment variable template
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Features

### ✅ MVP Complete
- [x] Excel-like grid (Handsontable)
- [x] Formula bar with live editing
- [x] HyperFormula engine (=SUM, =IF, =AVERAGE, =VLOOKUP, etc.)
- [x] Column types: text, number, date, boolean, select
- [x] Supabase auth (sign up / sign in)
- [x] Per-user sheet storage in Postgres JSONB
- [x] Auto-save with 1.5s debounce
- [x] Realtime sync via Supabase WebSocket
- [x] AI: Table generation from natural language
- [x] AI: Formula generation from natural language
- [x] AI: Dataset analysis and insights
- [x] AI: Intent routing (chat / table / formula / analyze)
- [x] CSV import (with auto type inference)
- [x] CSV + XLSX export
- [x] Sheet management (create, switch, delete)
- [x] Status bar with numeric aggregates (SUM, AVG, MIN, MAX)

### 🔜 Phase 2 Roadmap
- [ ] File attachments per row (Supabase Storage)
- [ ] Column sorting and filtering
- [ ] Multi-user collaboration cursors
- [ ] Custom formula templates library
- [ ] Chart generation from selection
- [ ] Row-level comments
- [ ] Webhook triggers on data change
- [ ] Public share links (read-only views)

---

## AI Commands (Natural Language)

The AI routes your message automatically:

| You say...                                   | AI does...                      |
|----------------------------------------------|---------------------------------|
| "Create a CRM table for sales leads"         | Generates table + loads it      |
| "Formula to calculate 10% tax on column B"   | Returns =B1*0.1 formula         |
| "Analyze my dataset and find trends"         | Returns analysis report         |
| "What's the difference between VLOOKUP and INDEX MATCH?" | Explains in chat |
| "SUM formula for column A rows 2 to 50"      | Returns =SUM(A2:A50)            |

---

## Security Notes

- **All credentials are environment variables** — never hard-coded
- **Row Level Security** enforced at Postgres layer — users cannot access other users' data
- **JWT authentication** via Supabase handles session management
- **OpenAI key** is exposed to the client (VITE_ prefix). For production, proxy requests through a backend edge function.

---

## Production Deployment

```bash
# Build
npm run build

# Deploy to Vercel
npx vercel deploy --prod

# Or Netlify
netlify deploy --prod --dir=dist
```

Set environment variables in your hosting dashboard (same as `.env.local`).

For production security, move OpenAI API calls to a **Supabase Edge Function** to hide the API key server-side.
