// hooks/useRealtime.js
// ─────────────────────────────────────────────────────────
// Supabase Realtime subscription hook.
// Listens for remote sheet changes and syncs local state,
// ignoring changes triggered by the local user.
// ─────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react'
import { supabase }          from '../lib/supabase'
import { useStore }          from '../store/spreadsheetStore'
import toast from 'react-hot-toast'

export function useRealtime(sheetId) {
  const channelRef = useRef(null)
  const store      = useStore()

  useEffect(() => {
    if (!sheetId) return

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    channelRef.current = supabase
      .channel(`sheet_rt_${sheetId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'sheets',
          filter: `id=eq.${sheetId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const remote = payload.new
            // Only apply if we're not currently saving (avoid echo)
            if (!store.isSaving) {
              if (remote.columns) store.setColumns(remote.columns)
              if (remote.rows)    store.setGridData(remote.rows)
              toast('📡 Sheet updated by another user', { duration: 2000 })
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [sheetId])
}
