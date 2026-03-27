# StreetCred — Your Work Builds Your Credit

> **Interswitch × Enyata Hackathon Submission**  
> *Turning Nigeria's invisible workers into financially visible entrepreneurs.*

---

<div align="center">

![StreetCred Banner](https://img.shields.io/badge/StreetCred-Financial%20Identity%20for%20Every%20Worker-1E3A8A?style=for-the-badge)

[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Interswitch](https://img.shields.io/badge/Powered%20by-Interswitch-FF6B00?style=flat-square)](https://interswitch.com/)

</div>

---

## Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Live Demo](#live-demo)
- [Team & Contributions](#team--contributions)
- [Judging Criteria Response](#judging-criteria-response)
- [Interswitch API Integration](#interswitch-api-integration)
- [Technical Architecture](#technical-architecture)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Security Model](#security-model)
- [Design System](#design-system)

---

## The Problem

Over **60% of Nigeria's workforce** operates within the informal economy — mechanics, electricians, tailors, barbers, food vendors, artisans, and market traders who earn their income daily through independent work.

Despite being economically active and hardworking, these individuals are **financially invisible**:

| Problem | Real-World Impact |
|---|---|
| No verifiable income history | Cannot access loans or credit facilities |
| Cash-based transactions | No documented payment trail |
| No professional reputation system | Customers cannot verify trust before hiring |
| Excluded from formal financial system | Millions locked out of products that could grow their businesses |

**The result:** A massive, productive segment of Nigeria's economy is structurally excluded from the financial tools that could help them grow — not because they haven't earned it, but because their work has never been recorded.

---

## Our Solution

**StreetCred** converts every job, every payment, and every customer review into a structured, verifiable financial record — giving informal workers a **digital credibility profile** that builds over time.

```
Worker completes a job
         ↓
Customer pays securely via Interswitch
         ↓
Payment is verified server-side (Interswitch Transaction API)
         ↓
Transaction recorded in worker's financial history
         ↓
Trust Score updated (jobs + payments + ratings)
         ↓
Worker's financial identity grows with every transaction
         ↓
Path to micro-credit, business loans, and formal financial access
```

### Why This Works

- **Workers** get a verified, portable financial identity that follows them across clients and years
- **Customers** get a trusted marketplace with verified worker histories and secure payment
- **Financial institutions** get structured, verified transaction data to assess creditworthiness
- **The economy** gets a bridge between the informal sector and the formal financial ecosystem

---

## Live Demo

> **[https://street-cred.vercel.app](https://street-cred.vercel.app)**

### Demo Credentials

| Role | Email | Password |
|---|---|---|
| Worker | `demo.worker@streetcred.ng` | `Demo1234!` |
| Customer | `demo.customer@streetcred.ng` | `Demo1234!` |

---

## Team & Contributions

### Bankole Jeremiah — Lead Developer & Co-Founder

**Technical Contributions:**

| Area | What Was Built |
|---|---|
| **Architecture & Setup** | Next.js 16 App Router project structure, TypeScript configuration, Tailwind v4 design system, MongoDB Atlas integration with connection pooling and hot-reload safe singleton |
| **Authentication System** | Complete auth system built from scratch — HMAC-SHA256 signed httpOnly cookies, bcrypt password hashing (cost factor 12), timing-safe login to prevent email enumeration, MongoDB TTL session cleanup, Next.js 16 `proxy.ts` middleware |
| **Route Protection** | `proxy.ts` with layered gates: auth gate → verification gate → onboarding gate → role-based routing, all with direct DB access (Node.js runtime) |
| **Onboarding Flow** | 3-step worker wizard (profession → skills/bio/location → bank account verification), 1-step customer flow, `isOnboarded` middleware enforcement |
| **Bank Account Verification** | Integrated Interswitch Marketplace API — live bank list (Nigerian banks with 1-hour cache), real-time account number resolution with 600ms debounce, auto-filled verified account name, server-side re-verification on submit |
| **Payment System** | Full Interswitch Web Checkout integration — Inline Checkout widget (customer never leaves the page), separate OAuth2 credentials for payments vs marketplace, server-side transaction verification with amount validation, atomic settlement using MongoDB `findOneAndUpdate` to prevent race conditions |
| **Job State Machine** | Complete hire lifecycle with 6 states (`requested → accepted → in_progress → completed → paid → cancelled`), timeline logging on every transition, role-based action guards, automated notifications |
| **Trust Score Engine** | Custom scoring algorithm: completed jobs (40%) + verified payments (30%) + average rating (20%) − dispute penalty (10%), incremental updates after each event, full recalculation utility for data repair |
| **Worker Directory** | Public directory with profession/state/city filters, paginated results sorted by trust score, worker profile pages with reviews |
| **Analytics System** | MongoDB aggregation pipelines for 6-month earnings (zero-filled), job status breakdown, rating trend — SVG charts with no external chart library |
| **Reviews System** | Post-payment review gate, star ratings, automatic trust score recalculation, rating distribution display |
| **Notifications** | Real-time notification bell with 30-second polling, tab-focus refresh, unread count badge, time-ago timestamps, mark-all-read |
| **Profile Management** | Shared profile edit page for both roles, base64 image upload with size validation, worker availability toggle, read-only verified fields |
| **Landing Page** | Animated public landing page — scroll-reveal animations, animated counters, floating hero cards, interactive dashboard mockup toggle (worker/customer), auth-aware CTAs |
| **API Layer** | Production API routes across auth, workers, jobs, payments, reviews, banking, notifications, analytics, and user profile — all with standardised error handling |
| **Race Condition Fix** | Identified and fixed payment double-settlement: webhook + callback both triggering, atomic `findOneAndUpdate` claim pattern ensures only one call can settle a payment |
| **Security Hardening** | HMAC webhook verification, amount mismatch detection, role guards on every endpoint, IP activity logging, security headers via `vercel.json` |
| **Deployment** | Vercel deployment configuration, environment variable structure, connection string troubleshooting for DNS SRV issues |

**Non-Technical Contributions:**
- **Product vision** — identified the financial identity gap in Nigeria's informal economy as the core problem to solve
- **Research** — studied Interswitch API documentation, BVN verification workflows, and informal worker financial access patterns in Nigeria
- **System design** — designed the Trust Score formula and weighting system, the job state machine, and the two-role platform architecture
- **Business model** — defined the worker/customer/financial institution value exchange and the path to credit access

---

### Obafemi Elijah — Design Lead & Co-Founder

**Design Contributions:**

| Area | What Was Delivered |
|---|---|
| **Brand Identity** | StreetCred visual identity — navy primary (#1E3A8A), emerald accent (#10B981), slate secondary (#6D7598) — a palette communicating trust, growth, and professionalism for the Nigerian market |
| **Design System** | Complete CSS design token system — 9-colour ramps (50–900 stops each), semantic shadcn/ui token mapping, dedicated sidebar token set, dark mode overrides for every token |
| **Landing Page Design** | Hero section layout with floating cards, feature grid, testimonial layout, stats row, CTA banner — full reference designs |
| **Dashboard UX** | Information architecture for worker dashboard (5 sections) and customer dashboard (3 sections), sidebar navigation design, mobile-first responsive layout decisions |
| **Component Design** | Trust Score ring visualisation concept, notification bell pattern, job status badge system, timeline component, worker card layout in the directory |
| **Onboarding UX** | Step-by-step onboarding flow design, bank verification interaction pattern (auto-fill on resolve), progress indicator design |
| **Payment Flow UX** | Pay page layout, callback/success/failure states, review submission flow — designed to reduce drop-off at each step |
| **Dark Mode** | Complete dark mode specification — every component reviewed and adjusted for accessibility and aesthetics |
| **Mobile Design** | Responsive breakpoints across all pages, mobile sidebar overlay, mobile-optimised hero, touch-friendly form elements |
| **Typography** | Font pairing: Instrument Serif (editorial headlines) + Plus Jakarta Sans (body) for the landing page — selected to project credibility without being corporate |

**Non-Technical Contributions:**
- **Competitive analysis** — researched existing Nigerian platforms (Workpay, Kippa, PalmPay Business, Workman) to identify gaps, unmet needs, and differentiation opportunities
- **Feature documentation** — authored the initial product brief, full feature requirements document, and user stories for both the worker persona (Chukwuemeka, mechanic) and customer persona (Adaeze, business owner)
- **Market research** — researched statistics on Nigeria's informal economy size, financial exclusion rates, BVN penetration, and the CBN's National Financial Inclusion Strategy (NFIS 3.0) targets used in the problem statement
- **UX copy** — product copy: onboarding instructions, empty state messages, error messages, notification text, CTA copy.
- **QA & testing** — manually tested all user flows across different browsers; documented and monitored for bugs during development

---

## Judging Criteria Response

### 1. Problem Solved

**Clear, real-world problem with validated evidence:**

Over **40 million Nigerians** work in the informal economy. The Central Bank of Nigeria's own National Financial Inclusion Strategy (NFIS 3.0) identifies informal workers as the primary target group for financial inclusion, yet:

- Credit access remains below **5% of the adult population**
- BVN penetration has reached **55+ million** — these people have bank accounts
- The missing link is **verified income documentation** — not the absence of work, but the absence of records

StreetCred fills this gap by making the work they're already doing visible, verifiable, and valuable to financial institutions.

**Impact pathway:**
1. Worker completes verified jobs → earns Trust Score
2. Trust Score provides credibility signal to customers → more job opportunities
3. Verified payment history → eligible for micro-credit assessment
4. Micro-credit access → business growth → economic uplift

---

### 2. Technical Execution

**It works end-to-end in production.**

**Interswitch APIs integrated:**

| API | Integration Point | How It's Used |
|---|---|---|
| **Web Checkout — Inline** | `/payments/pay` page | Inline popup widget — customer completes payment without leaving the platform |
| **Transaction Search API** | `/api/payments/verify` | Server-side verification before settling — `ResponseCode === '00'` + amount match required |
| **Passport OAuth2 (Payments)** | `lib/payments/interswitch.ts` | Client credentials flow for payments API token with in-memory cache |
| **Marketplace — Bank List** | `/api/banking/banks` | Active Nigerian banks fetched live with 1-hour memory cache |
| **Marketplace — Account Resolve** | `/api/banking/resolve` | Real-time account verification — confirmed account name returned from bank |
| **Passport OAuth2 (Marketplace)** | `lib/banking/isw-marketplace.ts` | Separate credential set, independent token cache |
| **Webhook Handler** | `/api/payments/webhook` | Async payment confirmations with HMAC-SHA512 signature verification |

**Technical highlights worth noting for judges:**
- **Atomic settlement:** Race condition between webhook and callback prevented using MongoDB `findOneAndUpdate` atomic claim — not a common pattern but critical for payment integrity
- **Dual credential architecture:** Payments and Marketplace APIs use completely separate OAuth2 credential sets with independent token caches
- **Server-re-verification:** Bank account and payment data are re-verified server-side regardless of client-side state — prevents spoofing
- **102+ TypeScript files** across 12 database models, 7 services, 35 API routes, 18 pages

---

### 3. User Experience

**Worker experience:**
- Full onboarding in under 3 minutes
- Bank account number auto-resolves — no typing account name
- Dashboard shows trust score ring, earnings, jobs, and ratings at first glance
- Job requests arrive with notification bell; accept/start/complete with one action

**Customer experience:**
- Find workers filtered by profession, state, and city
- Trust Score visible before hiring — know who you're dealing with
- Pay with Interswitch Inline Checkout — widget opens on the same page
- Review flow auto-opens after successful payment

**Design decisions that measurably improve UX:**
- Inline Checkout removes the redirect and back-button UX problem
- Account number auto-resolves with debounce — no manual name entry, no typos
- Job timeline shows every state with timestamps — both parties always know what's happening
- Notification bell shows unread count and refreshes on tab focus

---

### 4. Innovation

**Three genuinely novel elements:**

**1. Work-as-Financial-Record**
Most fintech requires existing credit history to grant credit — a classic catch-22. StreetCred inverts this: the financial record is built by the work itself, through verified payments. Informal workers don't need to already be in the system — they enter it through work.

**2. Bank-Verified Identity as Onboarding Anchor**
Using Interswitch Marketplace to confirm the account holder name (not just account existence) means the name on file is legally confirmed by the bank — not self-reported. This becomes the identity anchor for everything on the platform.

**3. Trust Score as a Credit Proxy**
The Trust Score is not just a reputation metric — it's a structured, formula-based score built from independently verified data points (Interswitch-confirmed payments, customer ratings from verified transactions). At scale, this is exactly the kind of non-traditional credit signal that alternative lending products need.

---

### 5. Completeness

**Production-ready for demo:**

| Flow | Status |
|---|---|
| Registration + onboarding (worker & customer) | Complete |
| Bank account verification (Interswitch Marketplace) | Complete |
| Worker directory with filters | Complete |
| Full hire → pay → review cycle | Complete |
| Interswitch Inline Checkout | Complete |
| Trust Score calculation + display | Complete |
| Worker analytics dashboard | Complete |
| Notifications (real-time polling) | Complete |
| Profile edit with image upload | Complete |
| Landing page with animations | Complete |
| Responsive (mobile + desktop) | Complete |
| Deployed to Vercel | Complete |

---

## Interswitch API Integration

### Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         StreetCred                              │
│                                                                 │
│  ┌──────────────────────┐     ┌─────────────────────────────┐   │
│  │    Payments APIs     │     │    Marketplace APIs         │   │
│  │                      │     │                             │   │
│  │  OAuth2 Passport     │     │  OAuth2 Passport            │   │
│  │  (Credentials A)     │     │  (Credentials B)            │   │
│  │                      │     │                             │   │
│  │  Web Checkout        │     │  GET /bank-list             │   │
│  │  (Inline Widget)     │     │  POST /account-resolve      │   │
│  │                      │     │                             │   │
│  │  Transaction Search  │     │                             │   │
│  │                      │     │                             │   │
│  │  Webhook Handler     │     │                             │   │
│  └──────────────────────┘     └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Payment Flow (Step by Step)

```
1. Customer clicks "Pay now" on a completed job

2. POST /api/payments/initialize
   → Server fetches OAuth2 access token (Payments credentials)
   → Creates PENDING Payment record in MongoDB (idempotent)
   → Builds CheckoutConfig with access_token fetched server-side
   → Returns config to browser (access_token never in client bundle)

3. Browser dynamically loads inline-checkout.js from Interswitch CDN
4. window.webpayCheckout(config) → payment popup opens over the page
5. Customer completes payment (card or bank transfer)
6. onComplete callback fires in browser

7. Interswitch POSTs form data to POST /api/payments/callback
   → Extracts txnref from form body
   → 303 redirects browser to /payments/callback?txnref=XX (GET)

8. Client page calls POST /api/payments/verify
   → ATOMIC CLAIM: findOneAndUpdate({ status: 'pending' })
     → MongoDB ensures only ONE concurrent call can proceed
     → Sets status to 'processing' as an exclusive lock
   → GET /collections/api/v1/gettransaction.json
     → Validates ResponseCode === '00'
     → Validates returned amount === expected amount (fraud prevention)
   → Settlement chain:
     Payment.status = 'successful'
     Job.status = 'paid'
     WorkerEarnings += payment.amount
     TrustScore.completedJobs++, TrustScore.verifiedPayments++
     WorkerProfile.totalJobsCompleted++
     Notification created for worker

9. Interswitch webhook (async) → POST /api/payments/webhook
   → Same atomic claim → payment already 'processing' → exits safely
   → No double settlement
```

### Bank Verification Flow

```
1. Worker reaches Step 3 of onboarding

2. GET /api/banking/banks
   → OAuth2 token fetched (Marketplace credentials — separate from payments)
   → GET /verify/identity/account-number/bank-list
   → Active Nigerian banks returned, cached 1 hour in memory
   → Dropdown populated in browser

3. Worker selects bank + types account number
   → 600ms debounce starts on each keystroke
   → At 10 digits, POST /api/banking/resolve fires automatically

4. POST /api/banking/resolve (client)
   → POST /verify/identity/account-number/resolve (Interswitch)
   → Returns: status: "found", bankDetails.accountName
   → Account name field auto-fills and is locked (not editable)
   → Green verification appears with confirmed name

5. Worker submits Step 3
6. POST /api/auth/onboarding (server)
   → Checks bankVerified === true in request body (necessary)
   → Calls resolveAccount() AGAIN server-side (sufficient)
   → Client flag alone cannot bypass server verification
   → Saves Interswitch-confirmed accountName to BankAccount.verified = true
```

---

## Technical Architecture

### Stack

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components, API routes, `proxy.ts` — one framework for everything |
| **Language** | TypeScript 5 | End-to-end type safety across 102+ files |
| **Database** | MongoDB Atlas | Document model, TTL indexes, `findOneAndUpdate` atomicity |
| **ODM** | Mongoose 8 | Schema validation, typed models, aggregation pipelines |
| **Auth** | Custom (no Auth.js) | Full control — HMAC signing, cookie flags, single-session model |
| **Styling** | Tailwind CSS v4 | `@theme` CSS custom properties, no `tailwind.config.ts` needed |
| **Payments** | Interswitch Web Checkout | Hackathon requirement — Inline Checkout for better UX |
| **Deployment** | Vercel | Zero-config Next.js, serverless API routes, edge headers |

### System Layers

```
┌───────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                            │
│  Landing · Register · Onboard · Verify · Worker Dashboard     │
│  Customer Dashboard · Worker Directory · Payment Flow         │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTPS / Browser
┌───────────────────────▼───────────────────────────────────────┐
│                proxy.ts (Next.js 16, Node.js)                 │
│  ① Auth check (DB lookup)  ② Verification gate                │
│  ③ Onboarding gate         ④ Role-based routing               │
└───────────────────────┬───────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│               API ROUTES (35 endpoints)                       │
│  /api/auth/*  /api/workers/*  /api/jobs/*  /api/payments/*    │
│  /api/banking/*  /api/reviews/*  /api/notifications/*         │
└──────┬────────────────┬──────────────────┬────────────────────┘
       │                │                  │
┌──────▼──────┐  ┌──────▼──────────┐   ┌───▼──────────────────┐
│  SERVICES   │  │ EXTERNAL APIs   │   │   MONGODB ATLAS      │
│             │  │                 │   │                      │
│ workerSvc   │  │ Interswitch     │   │  User · Session      │
│ jobSvc      │  │ ├ Web Checkout  │   │  WorkerProfile       │
│ paymentSvc  │  │ ├ Txn Search    │   │  Job · JobTimeline   │
│ reviewSvc   │  │ └ Marketplace   │   │  Payment             │
│ analyticsSvc│  │   ├ Bank List   │   │  Review · TrustScore │
│ notifSvc    │  │   └ Acct Resolve│   │  WorkerEarnings      │
│ verifySvc   │  │                 │   │  BankAccount         │
└─────────────┘  └─────────────────┘   │  Notification        │
                                       │  ActivityLog · Verif │
                                       └──────────────────────┘
```

---

## Features

### Worker Features

| Feature | Description |
|---|---|
| **Profile & Onboarding** | 3-step setup with automatic bank account verification via Interswitch |
| **Job Management** | Incoming requests, accept/decline, mark started, mark complete |
| **Earnings Dashboard** | Verified payment history with transaction references |
| **Trust Score** | Real-time score (0–100) built from completed jobs, verified payments, and ratings |
| **Analytics** | 6-month earnings bar chart, rating trend line, milestone tracking |
| **Reviews** | All customer reviews with star distribution breakdown |
| **Notifications** | Real-time bell — payment received, job updates, system messages |
| **Profile Edit** | Bio, skills, location, availability toggle, profile photo upload |

### Customer Features

| Feature | Description |
|---|---|
| **Worker Directory** | Search by profession, state, and city — sorted by trust score |
| **Worker Profiles** | Full profile with verified reviews, trust score, and earnings history |
| **Hire Flow** | Job request with title, description, price, location, scheduled date |
| **Job Tracking** | Real-time status with complete timeline |
| **Secure Payment** | Interswitch Inline Checkout — popup widget, no page redirect |
| **Post-Payment Review** | Star rating + comment, directly updates worker trust score |

---

## Database Schema

### 13 Models

```
User ──────────────── Session (TTL: auto-expire)
 │                    Verification (TTL: 10 min)
 │                    ActivityLog (TTL: 90 days)
 │
 └── WorkerProfile ── BankAccount (verified: true after ISW resolve)
           │
           ├── WorkerEarnings
           ├── TrustScore
           │
           └── Job ── JobTimeline (one entry per state transition)
                 │
                 └── Payment (pending → processing → successful/failed)
                       │
                       └── Review (one per job, post-payment only)
```

### Trust Score Formula

```
Score = min(completedJobs / 50, 1.0)    × 40   →  0–40 points
      + min(verifiedPayments / 50, 1.0) × 30   →  0–30 points
      + (averageRating / 5)             × 20   →  0–20 points
      − min(disputeCount × 5, 10)              →  0–10 deducted

Final score = clamp(round(total), 0, 100)
```

| Range | Status | Meaning |
|---|---|---|
| 0–29 | Building reputation | New worker, early transactions |
| 30–59 | Growing credibility | Established track record |
| 60–79 | Trusted worker | Strong verified history |
| 80–100 | Top rated | Eligible for credit assessment |

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register (worker or customer) |
| `POST` | `/api/auth/login` | None | Login, issue signed session |
| `GET` | `/api/auth/me` | Session | Current user |
| `DELETE` | `/api/auth/me` | Session | Logout |
| `POST` | `/api/auth/onboarding` | Session | Complete onboarding + bank verify |

### Workers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/workers` | None | Directory (profession, state, city filters) |
| `GET` | `/api/workers/me` | Worker | Own profile + dashboard stats |
| `GET` | `/api/workers/[id]` | None | Public profile + reviews |
| `GET` | `/api/workers/[id]/trust-score` | None | Trust score breakdown |

### Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/jobs` | Session | Role-aware job list |
| `POST` | `/api/jobs/create` | Customer | Create job request |
| `GET` | `/api/jobs/[id]` | Session | Detail + timeline |
| `POST` | `/api/jobs/[id]/accept` | Worker | Accept request |
| `POST` | `/api/jobs/[id]/start` | Worker | Mark started |
| `POST` | `/api/jobs/[id]/complete` | Worker | Mark complete |
| `POST` | `/api/jobs/[id]/cancel` | Either | Cancel |

### Payments (Interswitch)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/payments/initialize` | Customer | Returns CheckoutConfig for inline widget |
| `POST` | `/api/payments/callback` | None | Interswitch form POST redirect handler |
| `POST` | `/api/payments/verify` | Session | Server-side verify + atomic settlement |
| `GET` | `/api/payments/history` | Worker | Earnings history |
| `POST` | `/api/payments/webhook` | None | Async Interswitch notification |

### Banking (Interswitch Marketplace)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/banking/banks` | Session | Live bank list (180+ banks, 1hr cache) |
| `POST` | `/api/banking/resolve` | Session | Verify account + return account name |

### Reviews & Notifications

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reviews` | Customer | Submit review (paid jobs only) |
| `GET` | `/api/reviews/[workerId]` | None | Worker's reviews |
| `GET` | `/api/analytics/worker` | Worker | Full analytics bundle |
| `GET` | `/api/notifications` | Session | List + unread count |
| `PATCH` | `/api/notifications` | Session | Mark as read |
| `GET` | `/api/user/profile` | Session | Profile data for edit form |
| `PATCH` | `/api/user/profile` | Session | Update profile fields |
| `POST` | `/api/user/profile/image` | Session | Upload profile image (base64) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- MongoDB Atlas account (free M0 tier works)
- Interswitch developer accounts (Payments + Marketplace)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Adeoye-J/genius-lab.git
cd genius-lab

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in MONGODB_URI, SESSION_SECRET, and Interswitch credentials

# 4. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the landing page loads directly.

### MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → create free M0 cluster
2. **Database Access** → Add user with `readWrite` on database `street-cred`
3. **Network Access** → Add `0.0.0.0/0` for development
4. **Connect** → Drivers → copy the connection string
5. Replace `<password>` with your DB user password and append `/street-cred` before the `?`
6. Paste into `MONGODB_URI` in `.env.local`

> **Troubleshooting:** If `mongodb+srv://` fails with `ECONNREFUSED querySrv`, switch to the Standard (non-SRV) connection string from Atlas → Connect → Standard connection string. This resolves DNS SRV lookup issues on some ISPs and corporate networks.

### Vercel Deployment

```bash
# Push to GitHub
git init && git add . && git commit -m "StreetCred hackathon submission"
git remote add origin https://github.com/Adeoye-J/genius-lab.git
git push -u origin main

# Connect on vercel.com → New Project → Import from GitHub
# Add all environment variables in Vercel → Settings → Environment Variables
```

After deploying, register your webhook URL in the Interswitch merchant dashboard:
```
https://your-app.vercel.app/api/payments/webhook
```

---

## Environment Variables

```bash
# Core
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/street-cred
SESSION_SECRET=                         # openssl rand -base64 32 (min 32 chars)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Interswitch Payments (Quickteller Business Dashboard)
INTERSWITCH_CLIENT_ID=
INTERSWITCH_CLIENT_SECRET=
INTERSWITCH_MERCHANT_CODE=             # e.g. MX18722
INTERSWITCH_PAY_ITEM_ID=
INTERSWITCH_BASE_URL=https://qa.interswitchng.com
INTERSWITCH_PASSPORT_URL=https://qa.interswitchng.com

# Interswitch Marketplace (Marketplace Developer Console — separate credentials)
ISW_MARKETPLACE_CLIENT_ID=
ISW_MARKETPLACE_CLIENT_SECRET=
ISW_MARKETPLACE_BASE_URL=https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1
ISW_MARKETPLACE_PASSPORT_URL=https://qa.interswitchng.com
```

---

## Project Structure

```
streetcred/
├── app/                           # Next.js App Router (18 pages, 35 API routes)
│   ├── (auth)/login · register    # Auth pages
│   ├── onboarding/                # Post-registration wizard
│   ├── workers/[workerId]         # Public worker directory
│   ├── jobs/[jobId]               # Job detail + timeline
│   ├── payments/pay·callback·review
│   ├── dashboard/
│   │   ├── worker/                # 5 dashboard sections
│   │   ├── customer/              # 3 dashboard sections
│   │   └── profile/               # Shared profile edit
│   ├── page.tsx                   # Landing page
│   └── api/                       # 35 API routes
├── lib/
│   ├── auth/auth.ts · session.ts  # Auth helpers
│   ├── banking/isw-marketplace.ts # Marketplace API wrapper
│   ├── database/mongodb.ts        # Connection singleton
│   ├── payments/interswitch.ts    # Payments API wrapper
│   └── trust/trustScoreEngine.ts  # Score formula
├── services/                      # Business logic (7 services)
├── models/                        # 13 Mongoose schemas
├── hooks/                         # 6 React hooks
├── components/ui/                 # NotificationsBell
├── store/authStore.ts             # React context
├── config/env.ts · constants.ts   # Config
├── types/index.ts                 # TypeScript interfaces
├── utils/                         # errorHandler, formatCurrency, dateFormatter
├── styles/globals.css             # Tailwind v4 design system
├── proxy.ts                       # Next.js 16 route protection
└── vercel.json                    # Deployment config
```

---

## Security Model

| Threat | Mitigation |
|---|---|
| Password theft | bcrypt cost 12; hash stored, plaintext never persisted |
| Session forgery | HMAC-SHA256 signature on every cookie value; invalid signature = instant reject |
| XSS token theft | `httpOnly` cookies — JavaScript cannot read the session token |
| CSRF attacks | `sameSite: lax` on session cookie |
| Timing attacks | Login always runs `bcrypt.compare` regardless of whether user exists |
| Stale sessions | MongoDB TTL index auto-deletes expired sessions — no maintenance needed |
| Unauthorised access | Route protection in `proxy.ts` validates session in DB before every protected render |
| Privilege escalation | `requireRole()` enforced in every role-specific API handler |
| Payment tampering | Amount validated server-side: `ResponseCode === '00'` AND amount must match |
| Double settlement | MongoDB atomic `findOneAndUpdate` — only one concurrent call can claim settlement |
| Webhook spoofing | HMAC-SHA512 signature verification in production |
| Bank data spoofing | `bankVerified: true` from client is necessary but not sufficient — server re-verifies independently |
| Log accumulation | ActivityLog TTL: 90 days; Verification TTL: 10 minutes — auto-cleanup |

---

## Design System

### Brand Palette

| Token | Colour | Hex |
|---|---|---|
| Primary | Deep Navy | `#1E3A8A` |
| Accent | Emerald Green | `#10B981` |
| Secondary | Muted Slate | `#6D7598` |
| Background | Near White | `#F9FAFB` |
| Foreground | Deep Charcoal | `#0F172A` |

All colours are defined as CSS custom properties in `styles/globals.css` inside a Tailwind v4 `@theme` block — making every token available as a Tailwind utility (`bg-primary`, `text-accent`, `border-border`, etc.) and automatically overriding in dark mode.

### Typography

| Context | Font |
|---|---|
| Landing page headlines | Instrument Serif — editorial, authoritative |
| Landing page body | Plus Jakarta Sans — modern, readable |
| Dashboard / application UI | System font stack — fast, no FOUT |

### Key Design Decisions

- **Navy sidebar** on both dashboards using a dedicated `--sidebar-*` token set — dark, professional feel that separates navigation from content
- **Emerald accent** reserved exclusively for trust/success signals — trust scores, verified badges, payment confirmations
- **Animations** use CSS keyframes only — no animation libraries — keeping the bundle lean
- **No gradient backgrounds** in the UI — gradients are used only on the landing page hero and CTA sections, keeping the dashboard clean and functional

---

## Acknowledgements

- **Interswitch** — for the Web Checkout, Transaction Search, and Marketplace APIs that make StreetCred's payment and verification infrastructure possible
- **Enyata** — for organizing this hackathon and creating the platform for builders to tackle Nigeria's financial inclusion challenge
- **MongoDB Atlas** — free tier for development
- **Vercel** — deployment infrastructure

---

<div align="center">

**Built with purpose for Nigeria's 40 million informal workers.**

*Every job deserves to be counted.*

</div>