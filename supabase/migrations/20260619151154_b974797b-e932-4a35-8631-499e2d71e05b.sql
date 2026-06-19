
-- Cases: CNR + live eCourts fields
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS cnr_number text,
  ADD COLUMN IF NOT EXISTS court_complex text,
  ADD COLUMN IF NOT EXISTS case_status text,
  ADD COLUMN IF NOT EXISTS ecourts_last_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS ecourts_sync_status text,
  ADD COLUMN IF NOT EXISTS ecourts_sync_error text;

CREATE INDEX IF NOT EXISTS cases_cnr_number_idx ON public.cases (cnr_number) WHERE cnr_number IS NOT NULL;

-- Hearings: source tag + dedup index
ALTER TABLE public.hearings
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS hearings_case_date_purpose_uniq
  ON public.hearings (case_id, date, COALESCE(purpose, ''));

-- Calendar events: source tag + dedup index for ecourts-synced rows
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_ecourts_uniq
  ON public.calendar_events (case_id, date, title)
  WHERE source = 'ecourts' AND case_id IS NOT NULL;
