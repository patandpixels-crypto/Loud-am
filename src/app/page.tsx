"use client";

import { useState, FormEvent } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FiLock, FiDollarSign, FiUsers, FiShield, FiArrowRight,
  FiZap, FiTrendingUp, FiMessageSquare,
  FiCheckCircle, FiMail,
} from "react-icons/fi";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "duplicate" | "error">("idle");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

    setStatus("loading");

    try {
      // Check for duplicate
      const q = query(collection(db, "waitlist"), where("email", "==", trimmed));
      const existing = await getDocs(q);
      if (!existing.empty) {
        setStatus("duplicate");
        return;
      }

      await addDoc(collection(db, "waitlist"), {
        email: trimmed,
        joinedAt: Date.now(),
      });

      // Get total count for social proof
      const allSnap = await getDocs(collection(db, "waitlist"));
      setWaitlistCount(allSnap.size);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* === HERO === */}
      <section className="relative flex min-h-[90vh] items-center justify-center px-4">
        {/* Background glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        {/* Grid pattern */}
        <div className="grid-pattern absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
            <FiZap size={14} className="text-accent" />
            <span className="text-xs font-bold text-accent">Coming Soon</span>
          </div>

          {/* Logo */}
          <h1 className="animate-slide-up stagger-1 logo-text text-6xl leading-tight sm:text-8xl md:text-9xl">
            <span className="gradient-text">Yar</span>
            <span className="text-foreground">nam</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up stagger-2 mx-auto mt-6 max-w-xl text-lg text-subtext sm:text-xl">
            The anonymous platform where you post <span className="font-bold text-heading">honest organisation reviews</span> and
            earn <span className="font-bold text-accent-2">real money</span> when readers unlock your content.
          </p>

          {/* Waitlist Form */}
          <div className="animate-slide-up stagger-3 mx-auto mt-10 max-w-md">
            {status === "success" ? (
              <div className="rounded-2xl border border-positive/30 bg-positive/5 p-6">
                <FiCheckCircle size={32} className="mx-auto mb-3 text-positive" />
                <p className="text-lg font-bold text-heading">You&apos;re on the list!</p>
                <p className="mt-1 text-sm text-subtext">
                  We&apos;ll email you when Yarnam launches.
                </p>
                {waitlistCount && (
                  <p className="mt-3 text-sm font-bold text-accent-2">
                    #{waitlistCount} on the waitlist
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <FiMail
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error" || status === "duplicate") setStatus("idle");
                    }}
                    placeholder="Enter your email"
                    required
                    className="w-full rounded-xl border border-card-border bg-card-bg py-4 pl-11 pr-4 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-bounce group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-accent/25 transition-shadow hover:shadow-2xl hover:shadow-accent/30 disabled:opacity-60"
                >
                  {status === "loading" ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Join Waitlist
                      <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            {status === "duplicate" && (
              <p className="mt-3 text-sm font-medium text-accent-2">
                You&apos;re already on the waitlist! We&apos;ll be in touch soon.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-sm font-medium text-negative">
                Something went wrong. Please try again.
              </p>
            )}

            {status === "idle" && (
              <p className="mt-4 text-xs text-muted">
                Be the first to know when we launch. No spam, ever.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="relative px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-heading sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-subtext">Everything you can do on Yarnam — in five simple steps</p>
          </div>

          {/* Row 1: 3 steps */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15">
                <span className="text-2xl font-black text-accent">1</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Sign Up Free</h3>
              <p className="text-sm text-subtext">
                Create an account and get a unique anonymous codename. Your real identity stays hidden — always.
              </p>
            </div>

            <div className="bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-3/15">
                <span className="text-2xl font-black text-accent-3">2</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Post Reviews</h3>
              <p className="text-sm text-subtext">
                Share honest reviews about any person, brand, or organisation in the public feed. No filter, no bias.
              </p>
            </div>

            <div className="bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-2/15">
                <span className="text-2xl font-black text-accent-2">3</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Vote &amp; Engage</h3>
              <p className="text-sm text-subtext">
                Upvote or downvote reviews to surface the most helpful content. Reply and discuss in organisation sections.
              </p>
            </div>
          </div>

          {/* Row 2: 2 steps centered */}
          <div className="mx-auto mt-5 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-negative/15">
                <span className="text-2xl font-black text-negative">4</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Create Sections</h3>
              <p className="text-sm text-subtext">
                Start a staff-only section for your organisation. Only verified employees can post — readers pay to unlock.
              </p>
            </div>

            <div className="bento-card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-positive/15">
                <span className="text-2xl font-black text-positive">5</span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Get Paid</h3>
              <p className="text-sm text-subtext">
                Earn <span className="font-bold text-positive">50% of every unlock</span>. Refer friends for a 10% bonus on their first payment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === FEATURES BENTO GRID === */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-black text-heading sm:text-4xl">Why Yarnam?</h2>
            <p className="mt-3 text-subtext">The platform where honesty pays</p>
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
                Only verified employees can post in organisation sections — keeping content authentic and firsthand.
              </p>
            </div>

            {/* 50% Revenue Share */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-positive/15">
                <FiDollarSign size={22} className="text-positive" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">50% Revenue Share</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Half of every reader payment goes directly to the section&apos;s content creators. Real money for real reviews.
              </p>
            </div>

            {/* Voting System */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
                <FiTrendingUp size={22} className="text-accent" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Community Voting</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Upvote and downvote reviews. The most helpful content rises to the top.
              </p>
            </div>

            {/* Public Reviews */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-negative/15">
                <FiMessageSquare size={22} className="text-negative" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Public Reviews</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Share your real experience with any person, brand, or organisation. No filter, no bias.
              </p>
            </div>

            {/* Referral Bonus */}
            <div className="bento-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-2/15">
                <FiUsers size={22} className="text-accent-2" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-heading">Referral Bonus</h3>
              <p className="text-sm leading-relaxed text-subtext">
                Invite friends and earn 10% of their first payment. Your network, your earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === TRUST SIGNALS === */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-4">
              <FiCheckCircle size={20} className="shrink-0 text-positive" />
              <p className="text-sm text-subtext">Secure payments via Paystack</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-4">
              <FiCheckCircle size={20} className="shrink-0 text-positive" />
              <p className="text-sm text-subtext">Anonymous identity for every user</p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card-bg p-4">
              <FiCheckCircle size={20} className="shrink-0 text-positive" />
              <p className="text-sm text-subtext">Human-moderated content</p>
            </div>
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="relative px-4 py-24">
        <div className="hero-glow hero-glow-1" style={{ opacity: 0.08 }} />
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black text-heading sm:text-5xl">
            Ready to <span className="gradient-text">get real?</span>
          </h2>
          <p className="mt-4 text-lg text-subtext">
            Be among the first to share honest reviews and earn real money.
          </p>
          <div className="mt-8">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-bounce group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-10 py-4 text-base font-bold text-white shadow-xl shadow-accent/25"
            >
              Join the Waitlist
              <FiArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">Launching soon. Free to join.</p>
        </div>
      </section>
    </div>
  );
}
