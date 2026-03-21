"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import {
  FiMail, FiCheck, FiGift, FiLock, FiDollarSign, FiUsers,
  FiShield, FiArrowLeft, FiUser, FiEye, FiEyeOff,
} from "react-icons/fi";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      setIsSignUp(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError("Display name is required");
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, referralCode || undefined);
        setJustSignedUp(true);
        return;
      } else {
        await signIn(email, password);
      }
      router.push("/feed");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
        setError("Invalid email or password");
      } else if (message.includes("auth/email-already-in-use")) {
        setError("Could not create account. Please try signing in instead.");
      } else if (message.includes("auth/weak-password")) {
        setError("Password should be at least 6 characters");
      } else if (message.includes("auth/invalid-email")) {
        setError("Invalid email address");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (justSignedUp) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="animate-slide-up w-full max-w-md text-center">
          <div className="rounded-2xl border border-card-border bg-card-bg p-8 shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-positive/20">
              <FiMail size={28} className="text-positive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-heading">Check your email</h2>
            <p className="mb-4 text-sm text-subtext">
              We sent a verification link to <span className="font-bold text-accent-3">{email}</span>.
              Click the link to verify your account and unlock posting.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-accent-2/10 px-4 py-3 text-sm text-accent-2">
              <FiCheck size={16} />
              Account created successfully
            </div>
            <button
              onClick={() => router.push("/feed")}
              className="btn-bounce mt-6 w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 font-bold text-white shadow-lg shadow-accent/20"
            >
              Go to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left Panel — Branding (hidden on mobile) */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-background via-card-bg to-background lg:flex">
        {/* Background glows */}
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-3" />
        <div className="grid-pattern absolute inset-0" />

        <div className="relative z-10 max-w-md px-12">
          {/* Logo */}
          <h1 className="logo-text mb-6 text-5xl">
            <span className="gradient-text">LOUD</span>
            <span className="text-foreground">-AM!</span>
          </h1>

          <p className="mb-10 text-lg leading-relaxed text-subtext">
            The anonymous platform where <span className="font-bold text-heading">insiders get paid</span> for honest company reviews.
          </p>

          {/* Feature list */}
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-2/15">
                <FiShield size={18} className="text-accent-2" />
              </div>
              <div>
                <p className="font-bold text-heading">Anonymous Codenames</p>
                <p className="text-sm text-subtext">Your identity stays hidden. Always.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-positive/15">
                <FiDollarSign size={18} className="text-positive" />
              </div>
              <div>
                <p className="font-bold text-heading">50% Revenue Share</p>
                <p className="text-sm text-subtext">Earn real money when people read your posts.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                <FiLock size={18} className="text-accent" />
              </div>
              <div>
                <p className="font-bold text-heading">Staff-Only Sections</p>
                <p className="text-sm text-subtext">Only verified insiders can post.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-3/15">
                <FiUsers size={18} className="text-accent-3" />
              </div>
              <div>
                <p className="font-bold text-heading">Referral Bonuses</p>
                <p className="text-sm text-subtext">Earn $0.50 for every friend who joins.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link href="/" className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-heading">
            <FiArrowLeft size={14} />
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <h1 className="logo-text text-3xl">
              <span className="gradient-text">LOUD</span>
              <span className="text-foreground">-AM!</span>
            </h1>
            <p className="mt-1 text-sm text-subtext">
              Insider company talk. Get paid to share.
            </p>
          </div>

          {/* Header */}
          <h2 className="mb-2 text-2xl font-black text-heading">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mb-8 text-sm text-subtext">
            {isSignUp ? "Start posting and earning in 30 seconds" : "Sign in to continue to your feed"}
          </p>

          {/* Referral banner */}
          {isSignUp && referralCode && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-positive/10 px-4 py-3 text-sm text-positive">
              <FiGift size={16} />
              <span>You were referred! You&apos;ll both earn a bonus on your first purchase.</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl bg-negative/10 px-4 py-3 text-sm font-medium text-negative">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="mb-2 block text-sm font-medium text-subtle">Display Name</label>
                <div className="relative">
                  <FiUser size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-input-bg py-3.5 pl-11 pr-4 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                    placeholder="How should we call you?"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-subtle">Email</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-input-bg py-3.5 pl-11 pr-4 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-subtle">Password</label>
              <div className="relative">
                <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-input-bg py-3.5 pl-11 pr-12 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-subtext"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-bounce w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3.5 text-base font-bold text-white shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center text-sm text-subtext">
            {isSignUp ? "Already have an account?" : "Don\u2019t have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-bold text-accent-3 transition-colors hover:text-accent-3/80"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
