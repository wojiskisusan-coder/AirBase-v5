# ============================================================
# AirBase — Vercel Deployment Guide (No GitHub Required)
# ============================================================

## METHOD 1: Vercel CLI (Recommended — 3 commands)

### Step 1 — Install Vercel CLI
```
npm install -g vercel
```

### Step 2 — Deploy from this folder
```
cd airbase
vercel
```
Follow the prompts:
  - Set up and deploy? → Y
  - Which scope? → your account
  - Link to existing project? → N
  - Project name? → airbase (or anything)
  - In which directory is your code? → ./
  - Override settings? → N

Vercel will auto-detect Vite and build it.

### Step 3 — Set Environment Variables
After first deploy, go to:
  vercel.com → airbase project → Settings → Environment Variables

Add these 3 variables (all Environments: Production, Preview, Development):

  Name                    Value
  ──────────────────────────────────────────────────────
  VITE_SUPABASE_URL       https://xyznmggxouoxtvhjligi.supabase.co
  VITE_SUPABASE_ANON_KEY  [your NEW rotated anon key]
  VITE_OPENAI_API_KEY     [your NEW rotated OpenAI key]

Then redeploy:
```
vercel --prod
```

---

## METHOD 2: Drag & Drop (No CLI needed)

1. Open vercel.com → New Project → "Deploy without Git"
2. Drag the entire `airbase/` folder into the browser window
3. Vercel detects Vite automatically
4. Before confirming, click "Environment Variables" and add the 3 vars above
5. Click Deploy

---

## ⚠️ KEY ROTATION — DO THIS FIRST

The keys in your screenshot are compromised. Rotate before using:

OpenAI  → https://platform.openai.com/api-keys
         Delete old key → Create new key

Supabase → https://supabase.com/dashboard/project/xyznmggxouoxtvhjligi/settings/api
         Click "Reset" next to anon/public key

---

## Supabase Setup (One-time)

1. Go to: https://supabase.com/dashboard/project/xyznmggxouoxtvhjligi/sql/new
2. Paste the contents of supabase-schema.sql
3. Click Run
4. Go to Database → Replication → Enable "sheets" table on supabase_realtime

---

## Your Live URLs after deploy

  Production: https://airbase.vercel.app (or custom domain)
  Preview:    https://airbase-git-xxx.vercel.app

---

## Custom Domain (Optional)

vercel.com → airbase → Settings → Domains → Add your domain
