"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { FiMail, FiCheck, FiGift } from "react-icons/fi";

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
      router.push("/");
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
        <div className="w-full max-w-md text-center">
          <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-positive/20">
              <FiMail size={28} className="text-positive" />
            </div>
            <h2 className="mb-2 text-xl font-bold">Check your email</h2>
            <p className="mb-4 text-sm text-subtext">
              We sent a verification link to <span className="font-bold text-accent-3">{email}</span>.
              Click the link to verify your account and unlock posting.
            </p>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-accent-2/10 px-4 py-3 text-sm text-accent-2">
              <FiCheck size={16} />
              Account created successfully
            </div>
            <button
              onClick={() => router.push("/")}
              className="btn-bounce mt-6 w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 font-bold text-white shadow-lg shadow-accent/20"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="animate-float text-4xl font-black">
            <span className="gradient-text">LOUD</span>
            <span className="text-foreground">-AM!</span>
          </h1>
          <p className="mt-2 text-subtext">
            Speak your truth. <span className="text-accent-3">Be heard.</span>
          </p>
        </div>

        <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-8">
          <h2 className="mb-6 text-xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          {isSignUp && referralCode && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-positive/10 px-4 py-3 text-sm text-positive">
              <FiGift size={16} />
              <span>You were referred! You&apos;ll both earn a bonus on your first purchase.</span>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-negative/10 px-4 py-3 text-sm font-medium text-negative">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-subtle">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                  placeholder="How should we call you?"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                placeholder="Min. 6 characters"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-bounce w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 font-bold text-white shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-subtext">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="font-bold text-accent-3 hover:text-accent-3/80"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-zinc-600">
          <Link href="/" className="hover:text-subtext">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
