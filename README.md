# Yarnam

Be real. Get paid. An anonymous insider review platform where users post honest reviews about people, brands, and companies — and earn money doing it.

## Features

- **Post Reviews** — Share positive or negative experiences about people or brands
- **Anonymous Posting** — Every user gets a unique codename for privacy
- **Company Sections** — Staff-only insider sections with paid access
- **Earn 50% Revenue** — Content creators earn half of every reader payment
- **Upvote / Downvote** — Community-driven voting system
- **Referral Bonuses** — Earn 10% of every referred user's first purchase
- **Admin Dashboard** — Admin can see real identities and moderate content

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Firebase** (Auth + Firestore)
- **Paystack** (Payments — NGN & USD)

## Getting Started

### 1. Set up Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Create a **Firestore** database
4. Copy your Firebase config values

### 2. Configure Environment

Copy the example env file and fill in your Firebase credentials:

```bash
cp .env.local.example .env.local
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Create an Admin Account

1. Sign up through the app
2. In Firebase Console, go to Firestore → `users` collection
3. Find your user document and set `isAdmin: true`

### 5. Deploy Firestore Rules

Deploy the security rules from `firestore.rules` and indexes from `firestore.indexes.json` via the Firebase CLI.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider & Navbar
│   ├── page.tsx            # Landing page
│   ├── feed/page.tsx       # Dashboard / Review feed
│   ├── login/page.tsx      # Login & Registration
│   ├── post/
│   │   ├── new/page.tsx    # Create new post
│   │   └── [id]/page.tsx   # Individual post view
│   ├── sections/           # Company sections (paid access)
│   ├── admin/page.tsx      # Admin dashboard
│   └── profile/page.tsx    # User profile & earnings
├── components/
│   ├── Navbar.tsx           # Navigation bar with mobile menu
│   ├── PostCard.tsx         # Post card with animated voting
│   └── SectionCard.tsx      # Company section card
└── lib/
    ├── firebase.ts          # Firebase initialization
    ├── AuthContext.tsx       # Auth provider & hooks
    ├── pricing.ts           # Centralized pricing config
    └── types.ts             # TypeScript interfaces
```
