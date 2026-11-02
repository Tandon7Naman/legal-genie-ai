# Legal Genie AI (Tandon Associates)

> AI-powered legal research and case-management platform built for Indian lawyers, law firms, corporate legal teams and law students.

**Live demo:** https://script-law-ai.lovable.app

## Features

All features below are implemented in this repository.

### AI Legal Research
- Grounded legal search across Indian case law and statutes, with results categorized by source quality (Binding, Persuasive, Secondary).
- Dual-mode research workspace with separate prompts and tooling for professionals and students, switchable per user.
- AI follow-up questions on any research result.
- AI-generated IRAC case briefs and study flashcards from any research topic.
- Statute Simplifier that explains Indian statutes in plain language.
- Research collections to save and organize findings.
- Streaming AI responses with per-record deep analysis of judgments, orders and hearings.

### Case & Practice Management
- Unified case management with clients, hearings, calendar events and document links.
- Live eCourts India integration: CNR-number lookup, case details, hearing schedules, case-transfer details, and per-record AI case analysis with in-app PDF preview and download.
- Automatic eCourts synchronization for tracked cases (on-demand refresh plus a scheduled daily sync).
- Conflict checker that cross-references party names against existing clients and cases.
- Contract tracking, client invoicing and billable-hours finance management.
- Team management with staff roles (law firms and organizations).
- Corporate compliance checklists and a risk register.
- Immutable audit trail of user activity for compliance tracking.

### AI Drafting Lab
- Draft generation for ~45 Indian legal document types (writs, plaints, written statements, agreements, notices, Vakalatnama and more).
- Brief Analyzer to review uploaded or pasted drafts.

### Student Hub
- Moot court simulator, IRAC case-brief generator and statute simplification tools.
- Knowledge base with landmark cases, IPC/CrPC guides and IRAC study material.

### Platform
- Role-based access: student, individual lawyer, law firm, organization and admin — each role sees only its own sections.
- Admin portal for user/role management, complimentary access grants and platform analytics; admins can preview the app as any role.
- Customizable dashboard with drag-and-drop widgets and persisted layout/theme preferences.
- Global search (Cmd/Ctrl+K) across cases, clients and research.
- AI-powered personalized recommendations on the dashboard.
- User settings including profile, appearance and configurable idle-timeout auto-logout.
- First-login onboarding tour with one-click removable sample data.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router
- **Backend:** Supabase — Postgres with row-level security (RLS), authentication, storage, realtime, and serverless edge functions
- **AI:** Lovable AI gateway (Gemini-family models), called only from edge functions

## Architecture & Security

The app is a client-side SPA talking directly to Supabase for data and authentication. Every database table is protected by row-level security policies, so users can only read and write their own records.

All AI and third-party API calls (legal research, drafting, analysis, eCourts) run inside **Supabase edge functions**. Each function verifies the caller's JWT, and provider credentials (`LOVABLE_API_KEY`, `ECOURTS_API_KEY`, etc.) are stored as server-side function secrets — **no provider keys ever reach the browser**. The only values shipped to the client are the Supabase URL and the publishable (anon) key, which are safe to be public.

Roles are stored in a dedicated `user_roles` table and enforced through RLS policies and edge-function checks, never through client-editable metadata.

## Local Setup

```sh
# 1. Clone the repository
git clone <repo-url>
cd legal-genie-ai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your project's values (URL and publishable key are safe client-side values)

# 4. Start the dev server
npm run dev
```

Other scripts:

```sh
npm run build      # production build
npm run test       # run vitest suite
npm run lint       # eslint
```

Deployments are managed through Lovable; the Supabase backend, edge functions and secrets are configured there.

## Project Structure

```
├── src/
│   ├── components/          # UI components
│   │   ├── dashboard/       # Dashboard and drag-and-drop widgets
│   │   ├── layout/          # Sidebar, topbar, app shell
│   │   ├── settings/        # Settings sections
│   │   └── ui/              # shadcn/ui primitives
│   ├── pages/               # Route pages (Dashboard, Research, Cases, ECourts, Admin, …)
│   ├── hooks/               # Auth, onboarding, idle-logout and other hooks
│   ├── contexts/            # Auth and role-view providers
│   ├── lib/                 # Role access, SEO, MCP integration, utilities
│   └── integrations/supabase/  # Supabase client and generated types
├── supabase/
│   └── functions/           # Edge functions (AI + eCourts): legal-search, case-analyze,
│                            # brief-analyze, document-draft, ecourts-track, order-analyze, …
├── public/                  # Static assets, sitemap.xml, robots.txt
└── index.html
```

## License

MIT — see [LICENSE](LICENSE).
