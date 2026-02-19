"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

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
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
        setError("Invalid email or password");
      } else if (message.includes("auth/email-already-in-use")) {
        setError("An account with this email already exists");
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
