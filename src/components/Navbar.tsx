"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { FiPlus, FiLogOut, FiShield, FiUser } from "react-icons/fi";

export default function Navbar() {
  const { user, userProfile, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">
            <span className="text-accent">LOUD</span>
            <span className="text-foreground">-AM!</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/post/new"
                className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                <FiPlus size={16} />
                Post
              </Link>
              {userProfile?.isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-card-bg hover:text-white"
                >
                  <FiShield size={16} />
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-card-bg hover:text-white"
              >
                <FiUser size={16} />
                <span className="hidden sm:inline">{user.displayName || "Profile"}</span>
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-card-bg hover:text-white"
              >
                <FiLogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
