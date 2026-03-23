"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useTheme } from "@/lib/ThemeContext";
import {
  FiPlus, FiLogOut, FiShield, FiUser, FiBriefcase,
  FiDollarSign, FiSun, FiMoon, FiBell, FiAlertCircle, FiMail,
  FiMenu, FiX, FiMessageSquare, FiTrendingUp,
} from "react-icons/fi";

export default function Navbar() {
  const { user, userProfile, emailVerified, signOut, resendVerification, refreshVerification } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setTotalEarnings(null);
      setUnreadCount(0);
      return;
    }

    const fetchData = async () => {
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

      try {
        const notifQuery = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid),
          where("read", "==", false)
        );
        const notifSnap = await getDocs(notifQuery);
        setUnreadCount(notifSnap.size);
      } catch {
        setUnreadCount(0);
      }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user || emailVerified) return;
    const interval = setInterval(() => {
      refreshVerification();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, emailVerified, refreshVerification]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch {
      // silent fail
    } finally {
      setResending(false);
    }
  };

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href={user ? "/feed" : "/"} className="group flex items-center gap-2" onClick={closeMobile}>
            <span className="logo-text text-2xl transition-transform duration-300 group-hover:scale-105">
              <span className="gradient-text">Yar</span>
              <span className="text-foreground">nam</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1.5 md:flex">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="btn-bounce flex items-center justify-center rounded-xl p-2.5 text-subtext transition-colors hover:bg-surface hover:text-accent-2"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>

            {user ? (
              <>
                <Link
                  href="/feed"
                  className="btn-bounce flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent"
                >
                  <FiTrendingUp size={16} />
                  Feed
                </Link>
                {totalEarnings !== null && totalEarnings > 0 && (
                  <Link
                    href="/profile"
                    className="btn-bounce flex items-center gap-1.5 rounded-xl border border-positive/30 bg-positive/10 px-3.5 py-2 text-sm font-bold text-positive transition-colors hover:bg-positive/20"
                  >
                    <FiDollarSign size={14} />
                    <span className="stat-number">{totalEarnings.toFixed(2)}</span>
                  </Link>
                )}
                <Link
                  href="/post/new"
                  className="btn-bounce flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20"
                >
                  <FiPlus size={16} />
                  Post
                </Link>
                <Link
                  href="/notifications"
                  className="btn-bounce relative flex items-center justify-center rounded-xl p-2.5 text-subtext transition-colors hover:bg-surface hover:text-accent-2"
                >
                  <FiBell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-white shadow-lg shadow-accent/30">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/sections"
                  className="btn-bounce flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent-3"
                >
                  <FiBriefcase size={16} />
                  Sections
                </Link>
                {userProfile?.isAdmin && (
                  <Link
                    href="/admin"
                    className="btn-bounce flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent-2"
                  >
                    <FiShield size={16} />
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="btn-bounce flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-subtext transition-colors hover:bg-surface hover:text-accent"
                >
                  <FiUser size={16} />
                  {userProfile?.codeName || "Profile"}
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm text-subtext transition-colors hover:bg-negative/10 hover:text-negative"
                >
                  <FiLogOut size={16} />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="btn-bounce rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile: key actions + hamburger */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center rounded-xl p-2 text-subtext"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {user && (
              <>
                <Link
                  href="/post/new"
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-accent to-accent-2 p-2 text-white shadow-lg shadow-accent/20"
                >
                  <FiPlus size={18} />
                </Link>
                <Link
                  href="/notifications"
                  className="relative flex items-center justify-center rounded-xl p-2 text-subtext"
                >
                  <FiBell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center rounded-xl p-2 text-subtext transition-colors hover:bg-surface"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay fixed inset-0 z-40 bg-overlay md:hidden" onClick={closeMobile}>
          <div
            className="animate-slide-in-right absolute right-0 top-0 h-full w-72 border-l border-card-border bg-background p-6 pt-20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {user ? (
              <div className="space-y-1">
                {/* User info */}
                <div className="mb-5 rounded-xl border border-card-border bg-card-bg p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2">
                      <FiUser size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-heading">{userProfile?.codeName || "Anonymous"}</p>
                      {totalEarnings !== null && totalEarnings > 0 && (
                        <p className="text-sm font-bold text-positive">${totalEarnings.toFixed(2)} earned</p>
                      )}
                    </div>
                  </div>
                </div>

                <Link href="/feed" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-surface hover:text-heading">
                  <FiTrendingUp size={18} />
                  <span className="font-medium">Feed</span>
                </Link>
                <Link href="/profile" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-surface hover:text-heading">
                  <FiUser size={18} />
                  <span className="font-medium">Profile</span>
                </Link>
                <Link href="/sections" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-surface hover:text-heading">
                  <FiBriefcase size={18} />
                  <span className="font-medium">Sections</span>
                </Link>
                <Link href="/notifications" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-surface hover:text-heading">
                  <FiBell size={18} />
                  <span className="font-medium">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link href="/post/new" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-surface hover:text-heading">
                  <FiMessageSquare size={18} />
                  <span className="font-medium">New Post</span>
                </Link>
                {userProfile?.isAdmin && (
                  <Link href="/admin" onClick={closeMobile} className="flex items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-surface hover:text-heading">
                    <FiShield size={18} />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}

                <div className="my-3 h-px bg-card-border" />

                <button
                  onClick={() => { signOut(); closeMobile(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-subtext transition-colors hover:bg-negative/10 hover:text-negative"
                >
                  <FiLogOut size={18} />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="px-4 text-sm text-subtext">Join the conversation</p>
                <Link
                  href="/login"
                  onClick={closeMobile}
                  className="block rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-3 text-center font-bold text-white shadow-lg shadow-accent/20"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Verification Banner */}
      {user && !emailVerified && (
        <div className="border-b border-accent-2/20 bg-accent-2/5 px-4 py-2.5">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 text-sm">
            <FiAlertCircle size={16} className="text-accent-2" />
            <span className="text-subtext">
              Verify your email to unlock posting.
            </span>
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="btn-bounce flex items-center gap-1 rounded-full border border-accent-2/30 px-3 py-1 text-xs font-bold text-accent-2 hover:bg-accent-2/10 disabled:opacity-50"
            >
              <FiMail size={12} />
              {resent ? "Sent!" : resending ? "Sending..." : "Resend email"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
