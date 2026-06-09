## 1. Custom Flashcards in Student Hub
In `FlashcardsDialog.tsx`, add a "+ Create your own card" mode alongside AI generation:
- New "Add card" button reveals two inline inputs (Question, Answer) + Add to deck.
- Custom cards merge into the same `cards` array (flagged `custom: true` for badge).
- Existing "Save deck" flow already inserts into `study_flashcards` — works unchanged.
- Also allow editing/deleting any card before saving (small pencil/trash icons on the active card).
- Empty-deck case: user can build a fully manual deck without ever generating with AI.

## 2. Carry Topic Across Research Tabs
In `src/pages/Research.tsx`, share the last typed/searched topic between Legal Search, Case Analysis, and Statute Simplifier (both Professional and Student modes):
- Introduce a single `topic` state that mirrors `query`.
- When user switches tabs:
  - Search → Analyze: prefill `caseDetails` with current `query` if Analyze is empty.
  - Search/Analyze → Statute: pass `query`/`caseDetails` as initial value to `<StatuteSimplifier initialStatute={...} />`.
  - Statute → Search: prefill `query` with last statute text (trimmed to first 200 chars).
- Add a small "Use current topic" chip at the top of Analyze and Statute tabs so the carry-over is explicit and dismissible.
- `StatuteSimplifier` gets a new optional prop `initialStatute` and seeds its internal textarea once.

## 3. Duplicate Features Audit
Produce a single in-chat report (no code change) listing overlapping/duplicate functionality across the app so we can decide what to merge later. Initial scan to confirm and present:

```text
Area                          | Duplicated in
------------------------------|-------------------------------------------------
Search bar                    | GlobalSearch (Cmd+K), Research search, Cases list filter, Clients list filter
Document drafting             | Drafting > Compose, Drafting > Templates (both end in same generator)
Brief / IRAC generation       | Research "IRAC Brief" dialog, Drafting "Brief Analyzer", Student Hub Case Brief Generator
Flashcards                    | Research (Student mode) FlashcardsDialog, Student Hub flashcards
Statute Simplifier            | Research tab, Student Hub Statute Simplifier
Case analysis                 | Research "Case Analysis" tab, ECourts order-analyze, Drafting Brief Analyzer
Search history                | Research History tab, Dashboard ResearchHistoryWidget
Hearings / calendar           | Calendar page, Dashboard UpcomingHearingsWidget, Case detail hearings list
Tasks                         | Cases > tasks, Calendar > tasks, Dashboard quick-actions
Clients vs Conflict checker   | Clients page search, ConflictChecker page (same party lookup)
Onboarding tour vs FAQ        | OnboardingTour, FAQ, KnowledgeBase
"Get Started" / Sign-up CTA   | Navbar, HeroSection, PricingSection, ContactSection
```
The final report will be cross-verified by reading the listed files before delivery. Recommended merges will be flagged (e.g. unify flashcards under one component, single IRAC engine, one statute-simplifier entry surfaced in both Research and Student Hub).

## 4. Landing Navbar CTA: "Sign in" + "Create account"
In `src/components/landing/Navbar.tsx`:
- Replace the single **Get Started** button with two buttons:
  - **Sign in** (ghost / outlined gold) → `/auth?mode=signin`
  - **Create account** (filled gold) → `/auth?mode=signup`
- Apply in both desktop and mobile menus.
- `src/pages/Auth.tsx` already reads search params for default tab — confirm and pass `mode` accordingly; if not wired, add a small effect to set the active tab from `?mode=`.
- Also update matching CTAs in `HeroSection` (primary stays "Create account", add secondary "Sign in") for consistency. PricingSection/Footer "Get Started" buttons updated to "Create account".

## 5. Expand Document Types in Drafting
Current dropdown in `src/pages/Drafting.tsx` has 10 types. Expand to a comprehensive Indian-law list, grouped via SelectGroup for readability:

```text
Pleadings & Petitions
  - Writ Petition (Art. 32 / 226)
  - Special Leave Petition (Art. 136)
  - Civil Suit Plaint (CPC)
  - Written Statement / Reply
  - Counter-Claim
  - Review / Revision / Appeal
  - PIL (Public Interest Litigation)

Criminal
  - FIR Quashing Petition (S.482 CrPC / S.528 BNSS)
  - Bail Application (Regular / Anticipatory / Interim)
  - Criminal Complaint (S.200 CrPC / S.223 BNSS)
  - Discharge / Acquittal Application
  - Protest Petition

Notices & Affidavits
  - Legal Notice (general)
  - Demand Notice (S.138 NI Act)
  - Notice under S.80 CPC
  - Cease & Desist Notice
  - Affidavit
  - Verification / Vakalatnama

Contracts & Agreements
  - Service Agreement
  - NDA (one-way / mutual)
  - Employment Agreement
  - Consultancy Agreement
  - Memorandum of Understanding
  - Joint Venture / Shareholders Agreement
  - Founders Agreement
  - Vendor / Supply Agreement
  - SaaS / Software Licence Agreement

Property & Family
  - Lease / Rental Agreement
  - Leave & Licence Agreement
  - Sale Deed / Agreement to Sell
  - Gift Deed
  - Power of Attorney (General / Special)
  - Will / Testament
  - Divorce Petition (Mutual / Contested)
  - Maintenance Petition (S.125 CrPC)
  - Adoption Deed

Corporate & Compliance
  - Board Resolution
  - Shareholder Resolution
  - Partnership Deed / LLP Agreement
  - Memorandum & Articles of Association
  - Compliance Opinion
  - GST / Tax Opinion

IP & Tech
  - Trademark Cease & Desist
  - Copyright Assignment
  - Licensing Agreement
  - Privacy Policy / Terms of Service

Consumer & Labour
  - Consumer Complaint (CPA 2019)
  - Labour Court Statement of Claim
  - Industrial Dispute Reference
```

Implementation:
- Switch `DOCUMENT_TYPES` array to grouped structure `{ group, items: [{ value, label }] }`.
- Render with shadcn `<SelectGroup><SelectLabel>…</SelectLabel>…</SelectGroup>` and ensure the `document-draft` edge function tolerates new `documentType` values (it currently passes the value straight into the prompt — safe).

## Out of scope
- Actually merging duplicate features (audit only this turn).
- Re-skinning Auth page.
- Adding new edge functions.

## Technical Notes
- Files touched: `src/components/research/FlashcardsDialog.tsx`, `src/components/research/StatuteSimplifier.tsx`, `src/pages/Research.tsx`, `src/components/landing/Navbar.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/PricingSection.tsx`, `src/pages/Auth.tsx` (mode param), `src/pages/Drafting.tsx`.
- No DB migrations required.
- No edge function changes.

## QA
- Build a manual flashcard, save deck, reopen from Student Hub — verify persistence.
- Type a query in Search, switch to Statute → textarea pre-filled; switch to Analyze → caseDetails pre-filled; dismissible chip works.
- Navbar: click Sign in → `/auth` opens with sign-in tab; Create account → sign-up tab; mobile menu mirrors.
- Drafting: every new document type generates without backend error; grouped dropdown scrolls correctly on mobile.
- Duplicate-features report posted in chat with file references.
