-- ============================================================
-- AirBase — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Sheets Table ──────────────────────────────────────────
-- Each row = one spreadsheet sheet owned by a user.
-- Columns and rows are stored as JSONB for flexibility.

CREATE TABLE IF NOT EXISTS public.sheets (
  id          UUID          DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT          NOT NULL DEFAULT 'Untitled Sheet',
  columns     JSONB         NOT NULL DEFAULT '[]'::jsonb,
  rows        JSONB         NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS sheets_user_id_idx ON public.sheets (user_id);

-- ── Row Level Security (RLS) ──────────────────────────────
-- Users can ONLY access their own sheets.

ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT — user can only read their own sheets
CREATE POLICY "Users can view own sheets"
  ON public.sheets FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: INSERT — user can only insert their own sheets
CREATE POLICY "Users can create own sheets"
  ON public.sheets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: UPDATE — user can only update their own sheets
CREATE POLICY "Users can update own sheets"
  ON public.sheets FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: DELETE — user can only delete their own sheets
CREATE POLICY "Users can delete own sheets"
  ON public.sheets FOR DELETE
  USING (auth.uid() = user_id);

-- ── Auto-update updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sheets_updated_at
  BEFORE UPDATE ON public.sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Storage Bucket ────────────────────────────────────────
-- For file attachments (run separately or via dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('attachments', 'attachments', false);

-- ── Realtime Publication ──────────────────────────────────
-- Enable realtime on the sheets table
-- (Run in Supabase Dashboard → Database → Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.sheets;

-- ============================================================
-- Verification queries (run to confirm setup)
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT policyname FROM pg_policies WHERE tablename = 'sheets';
