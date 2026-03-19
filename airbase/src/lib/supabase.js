// lib/supabase.js
// ─────────────────────────────────────────────────────────
// Supabase client singleton.
// Credentials are loaded from environment variables ONLY.
// Never hard-code credentials here.
// ─────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error(
    '[AirBase] Missing Supabase env vars.\n' +
    'Copy .env.example → .env.local and fill in credentials.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  realtime: { params: { eventsPerSecond: 10 } },
})

// ── Auth helpers ─────────────────────────────────────────
export const auth = {
  signUp:       (email, password) => supabase.auth.signUp({ email, password }),
  signIn:       (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut:      ()                => supabase.auth.signOut(),
  getUser:      ()                => supabase.auth.getUser(),
  onAuthChange: (cb)              => supabase.auth.onAuthStateChange(cb),
}

// ── Sheet DB helpers ─────────────────────────────────────
export const sheetsDb = {
  /** List all sheets owned by the current user */
  list: (userId) =>
    supabase
      .from('sheets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at'),

  /** Create a new sheet record */
  create: (userId, name) =>
    supabase
      .from('sheets')
      .insert({ user_id: userId, name, columns: [], rows: [] })
      .select()
      .single(),

  /** Update sheet data (columns + rows) */
  update: (sheetId, patch) =>
    supabase
      .from('sheets')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', sheetId),

  /** Delete a sheet */
  delete: (sheetId) =>
    supabase.from('sheets').delete().eq('id', sheetId),

  /** Subscribe to realtime changes for a sheet */
  subscribe: (sheetId, callback) =>
    supabase
      .channel(`sheet:${sheetId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sheets', filter: `id=eq.${sheetId}` },
        callback
      )
      .subscribe(),
}

// ── File Storage helpers ─────────────────────────────────
export const storage = {
  upload: (userId, file) => {
    const path = `${userId}/${Date.now()}_${file.name}`
    return supabase.storage.from('attachments').upload(path, file)
  },
  getPublicUrl: (path) =>
    supabase.storage.from('attachments').getPublicUrl(path),
}
