"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Earning } from "@/lib/types";
import {
  FiLock, FiDollarSign, FiUsers, FiShield, FiArrowRight,
  FiZap, FiAward, FiTrendingUp, FiMessageSquare, FiEye,
  FiCheckCircle,
} from "react-icons/fi";

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [totalPlatformEarnings, setTotalPlatformEarnings] = useState(0);
  const [topEarner, setTopEarner] = useState<{ name: string; amount: number } | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [sectionCount, setSectionCount] = useState(0);

  // Redirect logged-in users to feed
  useEffect(() => {
    if (user) {
      router.push("/feed");
    }
  }, [user, router]);

  // Fetch platform stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const earningsSnap = await getDocs(collection(db, "earnings"));
        const allEarnings = earningsSnap.docs.map((d) => d.data() as Earning);
        const total = allEarnings.reduce((sum, e) => sum + e.amount, 0);
        setTotalPlatformEarnings(total);

        // Top earner this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const monthEarnings = allEarnings.filter((e) => e.createdAt >= monthStart);
        if (monthEarnings.length > 0) {
          const totals: Record<string, number> = {};
          for (const e of monthEarnings) {
            totals[e.userId] = (totals[e.userId] || 0) + e.amount;
          }
          let topUserId = "";
          let topAmount = 0;
          for (const [uid, amount] of Object.entries(totals)) {
            if (amount > topAmount) { topUserId = uid; topAmount = amount; }
          }
          if (topUserId) {
            const userDoc = await getDoc(doc(db, "users", topUserId));
            const codeName = userDoc.exists()
              ? (userDoc.data().codeName || userDoc.data().displayName)
              : "Anonymous";
            setTopEarner({ name: codeName, amount: topAmount });
          }
        }
      } catch {
        // silent
      }

      try {
        const postsSnap = await getDocs(collection(db, "posts"));
        setPostCount(postsSnap.size);
      } catch { /* silent */ }

      try {
        const sectionsSnap = await getDocs(collection(db, "companySections"));
        setSectionCount(sectionsSnap.size);
      } catch { /* silent */ }
    };
    fetchStats();
  }, []);

  // Don't render landing for logged-in users
  if (user) return null;

  return (
    <div className="relative overflow-hidden">
      {/* === HERO === */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        {/* Background glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        {/* Grid pattern */}
        <div className="grid-pattern absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
            <FiZap size={14} className="text-accent" />
            <span className="text-xs font-bold text-accent">Anonymous. Paid. Powerful.</span>
          </div>

          {/* Logo */}
          <h1 className="animate-slide-up stagger-1 logo-text text-6xl leading-tight sm:text-8xl md:text-9xl">
            <span className="gradient-text">LOUD</span>
            <span className="text-foreground">-AM!</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up stagger-2 mx-auto mt-6 max-w-xl text-lg text-subtext sm:text-xl">
            Share <span className="font-bold text-heading">insider company reviews</span> anonymously.
            Get <span className="font-bold text-accent-2">paid</span> when people read your posts.
          </p>

          {/* CTA Buttons */}
          <div className="animate-slide-up stagger-3 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="btn-bounce group flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-8 py-4 text-base font-bold text-white shadow-xl shadow-accent/25 transition-shadow hover:shadow-2xl hover:shadow-accent/30"
            >
              Get Started Free
              <FiArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/feed"
              className="btn-bounce flex items-center gap-2 rounded-xl border border-card-border bg-card-bg/50 px-8 py-4 text-base font-bold text-subtext transition-colors hover:bg-surface hover:text-heading"
            >
              <FiEye size={18} />
              Browse Reviews
            </Link>
          </div>

          {/* Social proof stats */}
          <div className="animate-slide-up stagger-4 mx-auto mt-14 flex max-w-lg items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <p className="stat-number text-2xl font-black text-heading sm:text-3xl">{postCount}</p>
              <p className="mt-1 text-xs text-muted">Reviews</p>
            </div>
            <div className="h-8 w-px bg-card-border" />
            <div className="text-center">
              <p className="stat-number text-2xl font-black text-heading sm:text-3xl">{sectionCount}</p>
              <p className="mt-1 text-xs text-muted">Companies</p>
            </div>
            <div className="h-8 w-px bg-card-border" />
            <div className="text-center">
              <p className="stat-number text-2xl font-black text-positive sm:text-3xl">
                ${totalPlatformEarnings.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-xs text-muted">Paid Out</p>
            </div>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-heading sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-subtext">Three steps to start earning from insider knowledge</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Step 1 */}
            <div className="step-connector bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
                <span className="text-2xl font-black text-accent">1</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Create a Section</h3>
              <p className="text-sm text-subtext">
                Start a company section for any company you work at. Invite verified staff to contribute.
              </p>
            </div>

            {/* Step 2 */}
            <div className="step-connector bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-2/15">
                <span className="text-2xl font-black text-accent-2">2</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Post Insider Reviews</h3>
              <p className="text-sm text-subtext">
                Share honest reviews about companies, brands, or people — all under your anonymous codename.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-positive/15">
                <span className="text-2xl font-black text-positive">3</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Get Paid</h3>
              <p className="text-sm text-subtext">
                When readers pay $3 to access a section, <span className="font-bold text-positive">50% goes directly to you</span> — the content creators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES BENTO GRID === */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-heading sm:text-4xl">Why LOUD-AM?</h2>
            <p className="mt-3 text-subtext">The platform that pays you for the truth</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Anonymous Identity */}
            <div className="bento-card sm:col-span-2 lg:col-span-1">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-3/15">
                <FiShield size={22} className="text-accent-3" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Anonymous Identity</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Every user gets a unique codename. Your real identity is never shown to other users. Post freely without fear.
              </p>
            </div>

            {/* Staff-Only Sections */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-2/15">
                <FiLock size={22} className="text-accent-2" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Staff-Only Posting</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Only verified staff can post inside company sections, ensuring authentic insider content.
              </p>
            </div>

            {/* 50% Revenue Share */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-positive/15">
                <FiDollarSign size={22} className="text-positive" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">50% Revenue Share</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Half of every reader payment goes directly to the section&apos;s content creators. Real money for real insights.
              </p>
            </div>

            {/* Voting System */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                <FiTrendingUp size={22} className="text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Community Voting</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Upvote and downvote reviews. The best insider content rises to the top naturally.
              </p>
            </div>

            {/* Public Reviews */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-negative/15">
                <FiMessageSquare size={22} className="text-negative" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Public Reviews</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Post positive or negative reviews about any person, brand, or company. Let the world know.
              </p>
            </div>

            {/* Referral Bonus */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-2/15">
                <FiUsers size={22} className="text-accent-2" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Referral Bonus</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Earn $0.50 for every user you refer who makes their first purchase. Share your link and grow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === TOP EARNER SPOTLIGHT === */}
      {topEarner && (
        <section className="px-4 py-16">
          <div className="mx-auto max-w-md">
            <div className="animate-float-slow rounded-2xl border border-accent-2/20 bg-gradient-to-br from-accent-2/5 to-positive/5 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-2/20">
                <FiAward size={28} className="text-accent-2" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">Top Earner This Month</p>
              <p className="mt-2 text-2xl font-black text-heading">{topEarner.name}</p>
              <p className="stat-number mt-1 text-3xl font-black text-accent-2">${topEarner.amount.toFixed(2)}</p>
              <p className="mt-3 text-sm text-subtext">This could be you. Start posting today.</p>
            </div>
          </div>
        </section>
      )}

      {/* === TRUST SIGNALS === */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-4">
              <FiCheckCircle size={20} className="shrink-0 text-positive" />
              <p className="text-sm text-subtext">Server-side payment verification</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-4">
              <FiCheckCircle size={20} className="shrink-0 text-positive" />
              <p className="text-sm text-subtext">Anonymous codename for every user</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-4">
              <FiCheckCircle size={20} className="shrink-0 text-positive" />
              <p className="text-sm text-subtext">Admin moderation & content reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="relative px-4 py-24">
        <div className="hero-glow hero-glow-1" style={{ opacity: 0.08 }} />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black text-heading sm:text-5xl">
            Ready to <span className="gradient-text">speak up?</span>
          </h2>
          <p className="mt-4 text-lg text-subtext">
            Join the platform where insiders get paid for honesty.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="btn-bounce group flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-10 py-4 text-base font-bold text-white shadow-xl shadow-accent/25"
            >
              Create Free Account
              <FiArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">No credit card required. Start posting in 30 seconds.</p>
        </div>
      </section>
    </div>
  );
}
