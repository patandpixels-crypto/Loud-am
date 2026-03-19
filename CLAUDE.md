# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build (Next.js + Turbopack)
npm run lint     # ESLint
npm start        # Start production server
```

No test framework is configured.

## Architecture Overview

LOUD-AM is an anonymous review platform built on **Next.js 16 (App Router)** with **Firebase** (auth + Firestore) and **Paystack** (payments). Users post reviews about people/brands, vote on content, and earn money through company sections.

### Tech Stack
- Next.js 16.1.6 with Turbopack, React 19, TypeScript 5
- Tailwind CSS 4 (PostCSS plugin, not config file)
- Firebase Auth (email/password) + Firestore
- Paystack for payments (NGN ₦300 / USD $3)

### Path Alias
`@/*` maps to `./src/*`

### Provider Hierarchy (in `src/app/layout.tsx`)
```
ThemeProvider → AuthProvider → Navbar + {children}
```

### Key Lib Files
- `src/lib/AuthContext.tsx` — Auth provider with `useAuth()` hook. Handles sign in/up, email verification, profile loading from Firestore, codename generation, referral codes. Profile fetch has fallback on error.
- `src/lib/ThemeContext.tsx` — Dark/light toggle, persists to localStorage, sets `data-theme` on `<html>`.
- `src/lib/types.ts` — All TypeScript interfaces (UserProfile, Post, CompanySection, Earning, etc.)
- `src/lib/firebase.ts` / `src/lib/firebaseAdmin.ts` — Client and admin SDK init
- `src/lib/paystack.ts` — Payment verification
- `src/lib/rateLimit.ts` — Client-side rate limiting via localStorage

### Data Model (Firestore Collections)
- **users** — Profile with codeName, isAdmin, referralCode
- **posts** — Public reviews with voting (score = upvotes - downvotes)
- **votes** — Per-user vote tracking (supports anonymous via localStorage `anon_id`)
- **companySections** — Staff-only sections with approval workflow (pending → approved/rejected)
- **sectionPosts** / **sectionReplies** — Content within sections
- **sectionAccess** — Payment records ($3 access fee, server-created only)
- **earnings** — Revenue sharing records (50% to authors, server-created only)
- **notifications** — Vote/reply/earning alerts
- **reports** / **payoutRequests** — Moderation and payout workflows

### API Routes (Server-side)
- `POST /api/paystack/verify` — Verifies Paystack payment reference
- `POST /api/grant-access` — Grants section access after payment verification, distributes 50% earnings to post authors, awards $0.50 referral bonus. Uses Firebase Admin SDK. Idempotent.

### Monetization Flow
User pays $3 via Paystack → `/api/grant-access` verifies → creates `sectionAccess` → distributes 50% to section post authors as `earnings` → optional $0.50 referral bonus on first payment.

### Security Rules
`firestore.rules` must be deployed to Firebase separately (`firebase deploy --only firestore:rules` or paste in Firebase Console). Posts are publicly readable; most other collections require authentication. `sectionAccess` and `earnings` are server-write only (`allow create: if false`).

### Admin System
Admin status is set via `isAdmin: true` on the user's Firestore document. The admin page (`/admin`) shows real identities (not anonymous) and has tabs for managing posts, reports, payouts, and section approvals.

## Environment Variables

```
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# Firebase Admin (server-side)
FIREBASE_SERVICE_ACCOUNT_KEY          # JSON string

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
PAYSTACK_SECRET_KEY

# Optional
NEXT_PUBLIC_ADSENSE_CLIENT_ID
```

## Common Pitfalls

- Firestore queries with `orderBy` require composite indexes. Prefer client-side sorting to avoid index requirements.
- `useSearchParams()` must be wrapped in a `<Suspense>` boundary for static generation.
- Sections and posts fetches should use separate try/catch blocks so one failure doesn't block the other.
- The `score` field on posts may be undefined for older docs — always default: `(post.score || 0)`.
- Firestore rules deny by default for collections without explicit rules. Any new collection needs rules added to `firestore.rules` and deployed.
