"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post, Earning, CompanySection } from "@/lib/types";
import PostCard from "@/components/PostCard";
import SectionCard from "@/components/SectionCard";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  FiTrendingUp, FiPlus, FiFilter, FiSearch, FiAward,
  FiBriefcase, FiDollarSign, FiUsers, FiLock, FiArrowRight,
} from "react-icons/fi";

type FilterType = "all" | "positive" | "negative";
type SortType = "score" | "recent";

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sections, setSections] = useState<CompanySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [topEarner, setTopEarner] = useState<{ name: string; amount: number } | null>(null);
  const [totalPlatformEarnings, setTotalPlatformEarnings] = useState(0);

  // Fetch top earner of the month
  useEffect(() => {
    const fetchTopEarner = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const earningsSnap = await getDocs(collection(db, "earnings"));
        const allEarnings = earningsSnap.docs.map((d) => d.data() as Earning);

        // Total platform earnings (all time)
        const total = allEarnings.reduce((sum, e) => sum + e.amount, 0);
        setTotalPlatformEarnings(total);

        const monthEarnings = allEarnings.filter((e) => e.createdAt >= monthStart);

        if (monthEarnings.length === 0) return;

        const totals: Record<string, number> = {};
        for (const e of monthEarnings) {
          totals[e.userId] = (totals[e.userId] || 0) + e.amount;
        }

        let topUserId = "";
        let topAmount = 0;
        for (const [uid, amount] of Object.entries(totals)) {
          if (amount > topAmount) {
            topUserId = uid;
            topAmount = amount;
          }
        }

        if (!topUserId) return;

        const userDoc = await getDoc(doc(db, "users", topUserId));
        const codeName = userDoc.exists()
          ? (userDoc.data().codeName || userDoc.data().displayName)
          : "Anonymous";

        setTopEarner({ name: codeName, amount: topAmount });
      } catch (err) {
        console.error("Error fetching top earner:", err);
      }
    };
    fetchTopEarner();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch sections
        const sectionsQuery = query(collection(db, "companySections"), orderBy("createdAt", "desc"));
        const sectionsSnap = await getDocs(sectionsQuery);
        const sectionsData = sectionsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) as CompanySection[];
        // Only show approved sections on homepage
        setSections(sectionsData.filter((s) => s.status === "approved" || !s.status));

        // Fetch posts
        const postsRef = collection(db, "posts");
        const snapshot = await getDocs(postsRef);
        let fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        fetchedPosts = fetchedPosts.filter((p) => !p.hidden);

        if (filter !== "all") {
          fetchedPosts = fetchedPosts.filter((p) => p.sentiment === filter);
        }

        if (sort === "score") {
          fetchedPosts.sort((a, b) => b.score - a.score);
        } else {
          fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
        }

        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filter, sort]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Hero */}
      <div className="mb-10 text-center">
        <h1 className="logo-text animate-float text-5xl sm:text-6xl">
          <span className="gradient-text">LOUD</span>
          <span className="text-foreground">-AM!</span>
        </h1>
        <p className="mt-3 text-lg text-subtext">
          Insider company talk. <span className="font-bold text-accent-2">Get paid to share.</span>
        </p>
        {!user && (
          <Link
            href="/login"
            className="btn-bounce mt-5 inline-block rounded-full bg-gradient-to-r from-accent to-accent-2 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20"
          >
            Join the Conversation
          </Link>
        )}
      </div>

      {/* Value Proposition Cards */}
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/20">
            <FiLock size={18} className="text-accent-2" />
          </div>
          <p className="text-sm font-bold text-heading">Staff-Only Posting</p>
          <p className="mt-1 text-xs text-muted">Only verified staff can post insider content</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-positive/20">
            <FiDollarSign size={18} className="text-positive" />
          </div>
          <p className="text-sm font-bold text-heading">Earn 50% Revenue</p>
          <p className="mt-1 text-xs text-muted">Every $3 reader pays, half goes to you</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-accent-3/20">
            <FiUsers size={18} className="text-accent-3" />
          </div>
          <p className="text-sm font-bold text-heading">Anonymous Identity</p>
          <p className="mt-1 text-xs text-muted">Post under a codename, stay protected</p>
        </div>
      </div>

      {/* Platform Earnings Counter */}
      <div className="mx-auto mb-6 max-w-md rounded-xl border border-positive/20 bg-positive/5 px-5 py-4 text-center">
        <p className="text-xs font-medium text-subtext">Earned by insiders on LOUD-AM</p>
        <p className="mt-1 text-3xl font-black text-positive">
          ${totalPlatformEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-xs text-muted">and counting...</p>
      </div>

      {/* Top Earner Badge */}
      {topEarner && (
        <div className="mx-auto mb-8 flex max-w-md items-center gap-3 rounded-xl border border-accent-2/20 bg-accent-2/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-2/20">
            <FiAward size={18} className="text-accent-2" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-subtext">Top Earner This Month</p>
            <p className="text-sm font-bold text-heading">
              {topEarner.name}{" "}
              <span className="text-accent-2">${topEarner.amount.toFixed(2)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Unified Search Bar */}
      <div className="relative mb-8">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          type="text"
          placeholder="Search companies, names, brands, or links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-input-bg py-3 pl-11 pr-4 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
        />
      </div>

      {/* === SECTIONS (Primary Product) === */}
      <div className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiBriefcase size={20} className="text-accent-2" />
            <h2 className="text-xl font-black">Company Sections</h2>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Link
                href="/sections/create"
                className="btn-bounce flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/20"
              >
                <FiPlus size={14} />
                Create
              </Link>
            )}
            <Link
              href="/sections"
              className="btn-bounce flex items-center gap-1 rounded-full border border-card-border px-3 py-2 text-xs font-bold text-subtext hover:bg-surface hover:text-heading"
            >
              View All
              <FiArrowRight size={12} />
            </Link>
          </div>
        </div>

        {(() => {
          const sq = searchQuery.trim().toLowerCase();
          const filteredSections = sq
            ? sections.filter((s) => s.companyName.toLowerCase().includes(sq))
            : sections;

          return loading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-card-border bg-card-bg py-12 text-center">
              <FiBriefcase size={32} className="mx-auto mb-3 text-muted" />
              {sq ? (
                <>
                  <p className="mb-1 font-bold text-subtext">No results found</p>
                  <p className="mb-4 text-sm text-muted">
                    No company matching &ldquo;{searchQuery.trim()}&rdquo;
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-1 font-bold text-subtext">No company sections yet</p>
                  <p className="mb-4 text-sm text-muted">
                    {user ? "Be the first to create one and start earning!" : "Sign in to create a company section."}
                  </p>
                  {user && (
                    <Link
                      href="/sections/create"
                      className="btn-bounce inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 font-bold text-white shadow-lg shadow-accent/20"
                    >
                      <FiPlus size={16} />
                      Create Section
                    </Link>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                {(sq ? filteredSections : filteredSections.slice(0, 4)).map((section) => (
                  <SectionCard key={section.id} section={section} />
                ))}
              </div>
              {!sq && sections.length > 4 && (
                <div className="mt-3 text-center">
                  <Link href="/sections" className="text-sm font-bold text-accent-3 hover:text-accent-3/80">
                    See all {sections.length} sections &rarr;
                  </Link>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* === Divider === */}
      <div className="mb-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-card-border" />
        <span className="text-xs font-bold text-muted">PUBLIC REVIEWS</span>
        <div className="h-px flex-1 bg-card-border" />
      </div>

      {/* Leaderboard Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="text-accent" size={20} />
          <h2 className="text-xl font-bold">
            {sort === "score" ? "Top Posts" : "Recent Posts"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-xl border border-card-border">
            <button
              onClick={() => setSort("score")}
              className={`px-3 py-1.5 text-xs font-bold transition-all ${
                sort === "score"
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white"
                  : "text-subtext hover:text-heading"
              }`}
            >
              Top
            </button>
            <button
              onClick={() => setSort("recent")}
              className={`px-3 py-1.5 text-xs font-bold transition-all ${
                sort === "recent"
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white"
                  : "text-subtext hover:text-heading"
              }`}
            >
              New
            </button>
          </div>

          <div className="flex items-center gap-1 overflow-hidden rounded-xl border border-card-border">
            <FiFilter size={14} className="ml-2 text-muted" />
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1.5 text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-gradient-to-r from-accent to-accent-2 text-white"
                  : "text-subtext hover:text-heading"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("positive")}
              className={`px-2 py-1.5 text-xs font-bold transition-all ${
                filter === "positive"
                  ? "bg-positive text-white"
                  : "text-subtext hover:text-heading"
              }`}
            >
              +
            </button>
            <button
              onClick={() => setFilter("negative")}
              className={`px-2 py-1.5 text-xs font-bold transition-all ${
                filter === "negative"
                  ? "bg-negative text-white"
                  : "text-subtext hover:text-heading"
              }`}
            >
              -
            </button>
          </div>
        </div>
      </div>

      {/* Posts */}
      {(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q
          ? posts.filter((p) =>
              p.targetName.toLowerCase().includes(q) ||
              p.targetLinks.some((link) => link.toLowerCase().includes(q))
            )
          : posts;

        return loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-card-border bg-card-bg py-16 text-center">
            <p className="mb-2 text-xl font-bold text-subtle">
              {searchQuery.trim() ? "No results found" : "No posts yet"}
            </p>
            <p className="mb-4 text-muted">
              {searchQuery.trim()
                ? `Nothing about "${searchQuery}" yet. Be the first!`
                : "Be the first to speak up!"}
            </p>
            {!searchQuery.trim() && user && (
              <Link
                href="/post/new"
                className="btn-bounce inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 font-bold text-white shadow-lg shadow-accent/20"
              >
                <FiPlus size={16} />
                Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                rank={!searchQuery.trim() && sort === "score" ? index + 1 : undefined}
                onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
