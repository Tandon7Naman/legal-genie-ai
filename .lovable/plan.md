## Goal
When a case is added (or edited) with a CNR number, automatically pull live court data from eCourts — judge, court, status, case history, and **upcoming hearings** — and surface them in the case detail, Calendar, and Dashboard widgets. Keep it fresh with a daily background sync.

## What changes for the user
- New **CNR Number** field on the Add/Edit Case form.
- On save, the case auto-syncs from eCourts. A status chip shows "Synced just now / X hours ago".
- A **Refresh from eCourts** button on the case detail page for on-demand re-sync.
- Fetched upcoming hearings appear in the case's Hearings tab, the global **Calendar**, and the **Upcoming Hearings** dashboard widget.
- A scheduled job runs **once a day** to re-sync every case that has a CNR, so next-hearing dates and judges stay current without user action.

## Data model
Add to `cases`:
- `cnr_number` (text, nullable, indexed)
- `court_name`, `court_complex`, `judge_name`, `case_status` (text)
- `next_hearing_date` (timestamptz)
- `ecourts_last_synced_at` (timestamptz)
- `ecourts_sync_status` (text: `pending` | `success` | `failed`)
- `ecourts_sync_error` (text)

Hearings sync into the existing `hearings` table (linked via `case_id`) and mirror into `calendar_events` so the Calendar/Dashboard pick them up automatically. Sync is idempotent — keyed on `(case_id, hearing_date, purpose)` so re-runs update instead of duplicating.

## Backend
New edge function **`case-ecourts-sync`** (`verify_jwt = false`, validates JWT in code):
- Input: `{ caseId }`. Loads the case, confirms ownership via RLS-aware query.
- Calls the existing `ecourts-track` logic (`case-detail` by CNR) using `ECOURTS_API_KEY`.
- Writes judge / court / status / next hearing back to `cases`.
- Upserts upcoming hearings into `hearings` + `calendar_events`.
- Updates `ecourts_sync_status` and `ecourts_last_synced_at`.

New edge function **`case-ecourts-daily-sync`** (service-role, no JWT):
- Selects all cases with `cnr_number IS NOT NULL` that haven't synced in 20+ hours.
- Iterates with light rate-limiting and calls the same sync routine per case.
- Logs results to `activity_log`.

Schedule via `pg_cron` + `pg_net`, daily at 06:00 IST (00:30 UTC).

## Frontend
- `src/pages/CaseForm` (Add/Edit): add CNR input with format validation (`AAAA############`). On submit, after the case row is saved, invoke `case-ecourts-sync`. Show a toast: "Syncing from eCourts…" → success/failure.
- `src/pages/CaseDetail`: new **eCourts Sync** card showing last-sync time, judge, court, status, next hearing, and a **Refresh** button (re-invokes `case-ecourts-sync`).
- **Hearings tab** on the case: badge "From eCourts" on hearings created by the sync.
- No changes needed to Calendar or Upcoming Hearings widget — they already read from `hearings` / `calendar_events`.

## Failure handling
- Invalid CNR or eCourts API failure → case still saves; user sees inline error and a Retry button. `ecourts_sync_status = 'failed'`.
- Daily sync logs failures per case to `activity_log` without halting the batch.

## Out of scope (can be follow-ups)
- Historical orders/judgments auto-import (already available on-demand via the eCourts page).
- Push/email notifications when next hearing date changes.
- Bulk-import existing cases by CSV of CNRs.
