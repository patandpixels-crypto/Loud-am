"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import { FiPlus, FiLogOut, FiShield, FiUser, FiBriefcase, FiDollarSign, FiSun, FiMoon } from "react-icons/fi";

export default function Navbar() {
  const { user, userProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setTotalEarnings(null);
      return;
    }

    const fetchEarnings = async () => {
      try {
        const earningsQuery = query(
          collection(db, "earnings"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(earningsQuery);
        const total = snap.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);
        setTotalEarnings(total);
      } catch {
        setTotalEarnings(0);
      }
    };
    fetchEarnings();
  }, [user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="logo-text text-2xl transition-transform duration-300 group-hover:scale-105">
            <span className="gradient-text">LOUD</span>
            <span className="text-foreground">-AM!</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="btn-bounce flex items-center justify-center rounded-full p-2 text-subtext transition-colors hover:bg-surface hover:text-accent-2"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {user ? (
            <>
              {totalEarnings !== null && totalEarnings > 0 && (
                <Link
                  href="/profile"
                  className="btn-bounce flex items-center gap-1 rounded-full border border-positive/30 bg-positive/10 px-3 py-1.5 text-sm font-bold text-positive"
                >
                  <FiDollarSign size={14} />
                  {totalEarnings.toFixed(2)}
                </Link>
              )}
              <Link
                href="/post/new"
                className="btn-bounce flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20"
              >
                <FiPlus size={16} />
                Post
              </Link>
              <Link
                href="/sections"
                className="btn-bounce flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent-3"
              >
                <FiBriefcase size={16} />
                <span className="hidden sm:inline">Sections</span>
              </Link>
              {userProfile?.isAdmin && (
                <Link
                  href="/admin"
                  className="btn-bounce flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent-2"
                >
                  <FiShield size={16} />
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                className="btn-bounce flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent"
              >
                <FiUser size={16} />
                <span className="hidden sm:inline">{userProfile?.codeName || "Profile"}</span>
              </Link>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-subtext transition-colors hover:bg-negative/10 hover:text-negative"
              >
                <FiLogOut size={16} />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
