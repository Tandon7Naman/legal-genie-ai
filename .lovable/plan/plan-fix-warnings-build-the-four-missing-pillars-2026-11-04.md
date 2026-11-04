# Plan: Fix Warnings + Build the Four Missing Pillars

## What we are fixing

Verified current state (from code and database inspection):

1. **Two cosmetic warnings** in the app logs — a React Router notice and a warning around the cookie banner. Nothing is broken for users, but we will silence both.
2. **Student "5 AI queries / day" is advertised but never enforced** — a student could search unlimited times. The pricing page and FAQ promise 5/day resetting at midnight IST.
3. **The AI research has no legal database behind it** — answers come from the model's memory; only the eCourts order analyzer fetches real content.
4. **"Shared Cases & Clients" / "Up to 10 Team Members" is advertised but not built** — all data belongs to one account; the Team page shows nothing useful for firm members.
5. **Compliance is a static poster** — fixed text lists, decorative checkboxes, and a "View Template" button that does nothing.

Build order: 1 → 2 → 3 → 4 → 5 (quick wins first).

---

## 1. Cosmetic warning fixes (quick)

- Add the two future-flag options to the router setup in `src/App.tsx` so the React Router notices stop appearing.
- The cookie-banner warning's exact cause is not visible in the source, so we will first reproduce it in a browser run capturing the console, then fix the component that hands out the ref (most likely by making the cookie banner ref-tolerant or removing the stray ref), and confirm the warning is gone from the logs.

## 2. Student 5-queries/day limit (real enforcement)

- New `ai_daily_usage` table: one row per user per date (IST date, matching the FAQ's "resets at midnight IST"), counting queries. Users cannot edit it; it is managed by a secure server function that atomically checks-and-reserves a query only when the student is under the limit.
- Enforced inside the AI services themselves (legal search, student tools, follow-ups, flashcards, statute simplifier, case/brief analysis, drafting) so calling the service directly cannot bypass it. Role comes from the server's role records, never from the request.
- **Students: 5/day. Individual lawyers, firms, organizations, admins: unlimited. Complimentary (free-access) accounts: unlimited.**
- Only successful AI calls count; failed calls don't burn a query.
- UI: a "queries left today" counter on the Research page for students, and a friendly limit-reached card suggesting the upgrade instead of a raw error.

## 3. AI grounding — free sources first, paid API later

- Build one shared retrieval module with a swappable provider interface, used by the research and analysis services:
  - **Statutes:** when a query references an Act/section, fetch the real text from public India Code sources and feed it to the AI as context.
  - **Judgments/case documents:** use your existing eCourts key for case-specific orders and judgments (this already works for order analysis; extend it to search flows where a CNR is known).
- Until a judgments API key is added, the AI keeps its strict "do not invent citations" instructions, and every answer shows an honest badge: **"Verified sources" vs "AI knowledge only"** so users know whether the answer is database-backed.
- The provider interface is ready for the Indian Kanoon API: when you later create your account and paste the key here, real judgment retrieval switches on without rebuilding anything.

## 4. Shared firm workspace + real Team management

- New `organizations` and `organization_members` tables (owner / admin / member), linked to accounts. Cases, clients, invoices and documents gain an optional firm marker so the whole firm sees them.
- Access rules: members of the same firm can view the firm's shared records; only the record owner (or a firm admin) can edit them; existing personal data stays private unless moved into the firm workspace. Admin global visibility stays unchanged.
- **Team page becomes real management**: view members, add members two ways (your choice — both):
  - **Invite code:** the firm owner generates a code; a colleague enters it during sign-up (or in Settings) and joins the firm.
  - **Email invite:** the owner enters the colleague's email and they get an invitation link. This needs your own sender domain set up first — I'll build the invite flow now and it starts sending once the domain is configured (I'll walk you through the one-time domain setup).
- **Seat limit enforced:** firm accounts cap at 10 members (per the pricing page), checked server-side when adding a member.
- Removing a member unlinks their account immediately; the firm keeps records created in the firm workspace.

## 5. Compliance engine (from poster to product)

- Make the governance, checklist and risk-register content interactive and persistent: each item becomes a real task with owner, status, notes and a due date; completion state is saved per account (and per firm where shared).
- Overdue and due-soon items highlighted, with an upcoming-compliance summary on the dashboard.
- The "View Template" buttons open the actual template content in a dialog, with a download option.
- **AI Compliance Auditor:** a new service that takes the company's profile (entity type, sector, headcount, listing status) and generates a tailored compliance calendar plus flags gaps and risks in plain language, in line with Companies Act 2013 requirements. It follows the same "no invented citations" honesty rules as research.

---

## Technical notes

- All database changes go through migrations with proper access rules; the usage and membership tables are server-managed (users can't edit their own counters or grant themselves firm access).
- Edge functions keep the enforced AI model convention; retrieval is injected as context, never as user-editable input.
- Email invites use the built-in app-email system, blocked only on your sender domain (user action).
- A small automated test will cover the student limit (6th query rejected, 5 allowed) and the firm seat cap (11th member rejected).
- Final verification: browser run for the warnings, end-to-end check of a student hitting the limit, a firm member viewing another member's shared case, and the AI auditor generating a checklist.

## Your part

- Nothing today. Later (optional): Indian Kanoon API account for full judgment retrieval, and your email domain for invitation emails.
