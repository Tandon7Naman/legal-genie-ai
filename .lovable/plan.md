## Goal

When a user logs in for the first time, give them a guided tour and pre-populated sample data so the app feels alive. Provide a single "Clear sample data" button (top-right) that wipes the sample data, hides itself forever, and never re-seeds.

## User Flow

1. New user signs up → completes profile → lands on `/dashboard`.
2. App detects "first login" (no sample seeded yet, no real data) → automatically seeds sample data tagged as sample, and launches a quick guided tour.
3. Tour: 5–6 step overlay highlighting Dashboard widgets, Cases, Clients, Drafting, Research, and the Clear Sample Data button. User can skip or finish.
4. A floating "Clear Sample Data" pill button appears top-right on every page while sample data is present.
5. Clicking it shows a confirmation alert dialog. On confirm, all sample-tagged rows are deleted, the flag is flipped, and the button disappears for good — no future re-seeding even if the user deletes everything else.

## Sample Data Seeded

Lightweight, realistic Indian legal context, all marked `is_sample = true`:
- 3 clients (e.g. "Sharma Industries Pvt Ltd", "Rajesh Kumar", "Mehta & Co.")
- 3 cases (civil, criminal, corporate) linked to those clients with hearing dates
- 4 tasks (2 due soon, 2 later) linked to cases
- 2 calendar events (next hearing, client meeting)
- 2 saved drafts (a notice and a contract)
- 1 invoice + 1 billable hours entry
- 2 search history entries

## Schema Changes

Add `is_sample boolean NOT NULL DEFAULT false` column to: `clients`, `cases`, `tasks`, `calendar_events`, `saved_drafts`, `invoices`, `billable_hours`, `search_history`, `hearings`, `case_notes`, `communication_log`.

Add to `profiles`:
- `onboarding_completed boolean NOT NULL DEFAULT false`
- `sample_data_seeded boolean NOT NULL DEFAULT false`
- `sample_data_cleared boolean NOT NULL DEFAULT false`

The combination ensures: seed only when `sample_data_seeded = false AND sample_data_cleared = false`. Once cleared, never seed again.

## Backend

Two new edge functions (JWT-validated):
- `seed-sample-data` — inserts the sample rows for `auth.uid()`, sets `sample_data_seeded = true`. Idempotent: no-op if already seeded or cleared.
- `clear-sample-data` — deletes all rows where `user_id = auth.uid() AND is_sample = true` across the tagged tables, sets `sample_data_cleared = true`.

## Frontend

New components:
- `src/components/onboarding/OnboardingTour.tsx` — lightweight step-based overlay (no heavy lib; custom tooltip + spotlight using `position: fixed` and refs / data-attributes like `data-tour="dashboard-stats"`).
- `src/components/onboarding/ClearSampleDataButton.tsx` — fixed top-right pill button with AlertDialog confirmation. Reads `profiles.sample_data_seeded && !sample_data_cleared`.
- `src/hooks/useOnboarding.ts` — fetches profile flags, exposes `shouldSeed`, `shouldShowTour`, `hasSampleData`, and trigger helpers.

Wiring:
- In `AppLayout.tsx`: mount `ClearSampleDataButton` and `OnboardingTour`. On first load after login, if `shouldSeed`, invoke `seed-sample-data`, then mark `onboarding_completed = false` so the tour starts.
- Tour anchors via `data-tour="..."` attributes added to existing nav items and dashboard widgets — no visual change to those components.

## Edge Cases

- User signs up, never sees tour (closes tab) → next login still triggers because `onboarding_completed = false`.
- Sample data filtered out of analytics/win-rate etc.? Not needed; sample rows look like normal user data and counts of "active cases" will simply include them until cleared.
- User manually deletes a sample case via Cases page → fine; remaining sample rows still there, button still visible until they click Clear.
- After Clear: button gone, tour never reshows (`onboarding_completed = true` set when tour ends OR when Clear is pressed).

## Files

New:
- `supabase/migrations/<ts>_sample_data_columns.sql`
- `supabase/functions/seed-sample-data/index.ts`
- `supabase/functions/clear-sample-data/index.ts`
- `src/components/onboarding/OnboardingTour.tsx`
- `src/components/onboarding/ClearSampleDataButton.tsx`
- `src/hooks/useOnboarding.ts`

Edited:
- `src/components/AppLayout.tsx` — mount onboarding pieces
- `src/pages/Dashboard.tsx`, `src/components/AppSidebar.tsx` — add `data-tour` anchors
- `supabase/config.toml` — register two new functions

## Out of Scope

- No re-seed option once cleared (per requirement).
- No admin-side toggle for sample data.
