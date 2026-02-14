

# Tandon Associates — Full Stack Legal Tech Platform

## Background & Design Reference
The founder currently works at OneCard (getonecard.app). The platform design will draw inspiration from OneCard's sleek, modern aesthetic — bold typography, clean sections with dark/light contrast, prominent CTAs, and a polished tech-forward feel — adapted for a legal context with dark navy (#1a1f3d) and gold (#c9a84c) accents.

---

## Phase 1: Foundation — Landing Page & Navigation

### Public Website Pages
- **Hero Section** — Bold "Say Hi to Tandon Associates" headline with animated tagline, CTA buttons (Get Started / Contact Us), and a mockup of the platform dashboard (OneCard-style split layout)
- **Practice Areas** — Grid of all Indian law categories (Criminal, Civil, Corporate, Family, IP, Tax, Labour, Constitutional, Real Estate, Cyber, Environmental, Banking, Arbitration, etc.) with icons and short descriptions
- **Features Showcase** — Scroll-animated sections highlighting AI Research, Case Management, Document Drafting, and Customizable Dashboard (similar to OneCard's feature cards)
- **About / Team** — Firm story and attorney profiles
- **Pricing** — Tier comparison table (Student Free, Individual, Small Firm, Enterprise)
- **Contact** — Inquiry form with case type selector
- **Sticky Navigation** with mobile hamburger menu and "Get Started" CTA button

---

## Phase 2: Backend — Auth, Roles & Admin Panel

### Authentication (Lovable Cloud)
- Email/password signup + Google OAuth
- **Profiles table**: name, avatar, firm name, bar council number, institution (for students), expected graduation year
- **User roles table** (separate from profiles for security): roles enum — `student`, `individual_lawyer`, `law_firm`, `organization`, `admin`
- `has_role()` security definer function for all RLS policies
- Student self-declaration during signup (institution + graduation year)

### Admin Panel (`/admin`)
- **User Management** — View all registered users, search/filter by role, email, status
- **Grant Free Access** — Admin can toggle "free trial" or "complimentary access" for any user, overriding their billing tier for testing purposes
- **Role Management** — Admin can change user roles
- **Platform Analytics** — Total users, active cases, AI queries made, revenue overview
- **Content Management** — Edit practice area descriptions, team bios, pricing details
- Admin-only routes protected by server-side role check

---

## Phase 3: AI-Powered Legal Research

### Search & Analysis
- **Legal Search Bar** with filters (court level, year range, act/section, subject area)
- AI-powered search using Perplexity for grounded Indian law results (IPC, CrPC, CPC, Indian Kanoon references)
- **Case Summaries** — AI-generated summaries with key holdings, ratio decidendi, citations
- **Case Analysis Tool** — Paste/upload case details → get strengths, weaknesses, relevant precedents, likely outcome prediction
- **Document Drafting** — Select type (petition, contract, notice, affidavit, agreement) → fill parameters → AI generates draft with proper legal formatting
- **Search History** saved per user for pattern learning

### Backend
- Edge functions: `legal-search`, `case-analyze`, `document-draft`
- Perplexity connector for AI-grounded search
- Firecrawl connector for scraping Indian legal databases
- `search_history` and `user_activity` tables for adaptive learning

---

## Phase 4: Case & Client Management

### Case Tracker
- **Dashboard view** — Cards/list of all active cases with status badges, next hearing date, court info
- **Case Detail Page** — Full timeline, hearing schedule, tasks checklist, attached documents, notes
- **Calendar View** — Upcoming hearings and deadlines in month/week view
- **Document Upload** — Per-case file storage using Lovable Cloud Storage

### Client Management
- Client profiles with contact info and linked cases
- Communication log
- Invoice/billing status per client

### Backend
- Tables: `cases`, `clients`, `hearings`, `tasks`, `case_documents`, `case_notes`
- RLS: Users see only their own data; law firm role can share within organization
- Cloud storage bucket for documents

---

## Phase 5: Customizable Dashboard

### Widget System
- **Drag-and-drop dashboard** with rearrangeable widget cards
- Available widgets: Recent Cases, Upcoming Hearings, Research History, AI Insights, Quick Draft, Notifications, Case Statistics, "For You" Recommendations
- **Save/Load Layouts** — Persisted per user in `user_layouts` table (JSON positions)
- **Theme Selector** — Light/dark mode + accent color picker stored in `user_preferences`

---

## Phase 6: Billing & Subscriptions

### Stripe Integration
- **Student Tier** — Free (verified by self-declaration; admin can also grant free access)
- **Individual Lawyer** — Monthly/annual subscription
- **Small Law Firm** — Per-seat team plan
- **Enterprise / Organization** — Custom pricing with agreement workflow
- **Admin Free Access Override** — Admin can flag any account for complimentary access, bypassing Stripe billing
- Usage-based AI credit tracking for heavy users
- Subscription management in user settings

---

## Phase 7: Adaptive AI & Learning

### Pattern Recognition
- Track user research queries, document types drafted, case categories
- **"For You" Dashboard Widget** — Personalized case law and document suggestions based on practice patterns
- **Smart Suggestions** — During research and drafting, AI suggests relevant precedents and clauses based on user's history
- Aggregated (anonymized) analytics to improve platform-wide AI recommendations over time

---

## Routes Summary
| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/about` | Public | About the firm |
| `/practice-areas` | Public | All law categories |
| `/pricing` | Public | Subscription tiers |
| `/contact` | Public | Contact form |
| `/auth` | Public | Login / Signup |
| `/dashboard` | Authenticated | Customizable main dashboard |
| `/research` | Authenticated | AI legal search |
| `/drafting` | Authenticated | Document drafting |
| `/cases` | Authenticated | Case management |
| `/cases/:id` | Authenticated | Case detail |
| `/clients` | Authenticated | Client management |
| `/settings` | Authenticated | Profile, billing, preferences |
| `/admin` | Admin only | User management, free access grants, analytics |

