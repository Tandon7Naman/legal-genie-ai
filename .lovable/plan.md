# Enhance Research for Professionals & Students

## Goal
Turn `/research` into a dual-audience workspace: serious case-law research for lawyers, and a learning-friendly mode for students — without breaking the current search/analyze flow or BCI rules (no Win Rate).

## 1. Mode toggle (Professional ↔ Student)
- Segmented control at the top of `/research`: **Professional** (default for lawyer/firm/org roles) and **Student** (default for `student` role, auto-detected from `user_roles`).
- Mode is persisted per-user in `profiles.preferences` and changes:
  - System prompt sent to `legal-search` / `case-analyze` edge functions
  - Visible filters, output sections, and follow-up suggestions
  - CTA buttons under results (e.g., "Save as Brief" vs "Make Flashcards")

## 2. Professional enhancements
- **IRAC Brief output**: new "Generate Brief" button on any result → restructures into Issue / Rule / Application / Conclusion + Citations, saved to a new `research_briefs` table; "Attach to Case" picker links it to an existing case.
- **Compare Cases**: checkbox on each citation in `SourceQualityPanel`; selecting 2–3 opens a side-by-side table (Facts, Holding, Ratio, Court, Year) generated via a new `case-compare` edge function.
- **Collections**: bookmark any result into a named collection (`research_collections` + `research_collection_items`); collections list in a side drawer with export to PDF/DOCX (reuse existing draft export utility).
- **Follow-up suggestions**: after each result, AI returns 3 next-question chips (cited-by, distinguishing facts, statutory amendments).
- **Court/Judge context panel** (BCI-safe): pulls counts of cited judgments by court — no win/loss stats.

## 3. Student enhancements
- **Statute Simplifier**: paste section or pick from dropdown → plain-language explanation with examples and a "what to remember" box.
- **Flashcards & Quiz**: "Make Flashcards" CTA on any result generates Q/A cards (stored in `study_flashcards`) with a quick review modal.
- **Study Mode result style**: results render with definitions tooltipped, key terms highlighted, and a "Concepts covered" tag row.
- **Save to Study Notes** instead of "Attach to Case".
- Reuses Student Hub infra already in memory (IRAC generator, Statute Simplifier).

## 4. Shared upgrades (both modes)
- **Conversational follow-ups**: results panel becomes a thread — user can ask follow-ups; prior Q&A sent as context (capped tokens).
- **Voice query**: mic button in the search bar using existing Lovable AI transcription edge function.
- **Better history**: filter history by mode, pin items, re-run with one click.
- **Source Quality panel**: keep current Binding/Persuasive/Secondary, add per-citation "Open in eCourts" link when CNR is detected.

## Technical notes
- **Frontend**: extend `src/pages/Research.tsx`; new components under `src/components/research/`: `ModeToggle.tsx`, `IracBriefCard.tsx`, `CompareCasesDialog.tsx`, `CollectionsDrawer.tsx`, `FollowUpChips.tsx`, `FlashcardsDialog.tsx`, `StatuteSimplifier.tsx`, `VoiceQueryButton.tsx`.
- **Edge functions** (new, all JWT-gated, streaming where applicable):
  - `research-brief` — IRAC restructure
  - `case-compare` — side-by-side table JSON
  - `flashcards-generate` — Q/A pairs
  - `statute-simplify` — plain-language explainer
  - `research-followups` — 3 follow-up suggestions
  - extend `legal-search` system prompt with `mode: "professional" | "student"`.
- **DB migration** (new public tables, with GRANTs + RLS scoped to `auth.uid()`):
  - `research_briefs(id, user_id, case_id?, title, irac jsonb, source_query, created_at)`
  - `research_collections(id, user_id, name, created_at)`
  - `research_collection_items(id, collection_id, content, citations jsonb, created_at)`
  - `study_flashcards(id, user_id, deck_name, question, answer, created_at)`
  - add `preferences jsonb default '{}'` to `profiles` if missing (store `researchMode`).
- **Activity log** entries for brief creation, collection save, flashcards generated.

## Out of scope
- Win-rate / outcome prediction (BCI compliance).
- Replacing existing Search/Analyze/History tabs — they remain.
- Paid-tier gating changes (handled by existing subscription model).

## QA
- Switching modes updates prompt + UI without losing current result.
- IRAC brief saves and reopens correctly; attach-to-case writes link.
- Compare dialog handles 2 and 3 selections; blocks 1 and 4+.
- Collections export to PDF renders citations.
- Flashcards generate from any result and persist per user.
- RLS verified: user A cannot read user B's briefs, collections, or flashcards.
