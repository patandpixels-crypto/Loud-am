# LOUD-AM!

Speak your truth about people and brands. A community-driven platform where users can post honest reviews about people or brands they've dated, worked with, or done business with.

## Features

- **Post Reviews** — Share positive or negative experiences about people or brands
- **Anonymous Posting** — Choose to post anonymously or with your display name
- **Upvote / Downvote** — Community-driven voting system
- **Leaderboard** — Top-voted posts appear on the front page
- **Social Links** — Add links or social media handles of the person/brand you're reviewing
- **Admin Dashboard** — Admin can see the real identity behind anonymous posts
- **Filter & Sort** — Filter by sentiment (positive/negative) and sort by score or recency

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Firebase** (Auth + Firestore)

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
│   ├── page.tsx            # Homepage / Leaderboard
│   ├── login/page.tsx      # Login & Registration
│   ├── post/
│   │   ├── new/page.tsx    # Create new post
│   │   └── [id]/page.tsx   # Individual post view
│   ├── admin/page.tsx      # Admin dashboard
│   └── profile/page.tsx    # User profile & their posts
├── components/
│   ├── Navbar.tsx           # Navigation bar
│   └── PostCard.tsx         # Post card with voting
└── lib/
    ├── firebase.ts          # Firebase initialization
    ├── AuthContext.tsx       # Auth provider & hooks
    └── types.ts             # TypeScript interfaces
```
