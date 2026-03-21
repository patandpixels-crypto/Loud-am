"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post, Earning, CompanySection } from "@/lib/types";
import PostCard from "@/components/PostCard";
import SectionCard from "@/components/SectionCard";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  FiTrendingUp, FiPlus, FiFilter, FiSearch, FiAward,
  FiBriefcase, FiDollarSign, FiUsers, FiLock, FiArrowRight,
  FiClock, FiZap, FiStar,
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
        const sectionsSnap = await getDocs(collection(db, "companySections"));
        const sectionsData = sectionsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() })) as CompanySection[];
        setSections(
          sectionsData
            .filter((s) => s.status === "approved" || !s.status)
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      } catch (err) {
        console.error("Error fetching sections:", err);
      }

      try {
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
          fetchedPosts.sort((a, b) => (b.score || 0) - (a.score || 0));
        } else {
          fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
        }

        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }

      setLoading(false);
    };
    fetchData();
  }, [filter, sort]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* === HERO SECTION === */}
      <div className="animate-slide-up mb-10">
        {/* Logo + Tagline */}
        <div className="mb-8 text-center">
          <h1 className="logo-text text-5xl sm:text-7xl">
            <span className="gradient-text">LOUD</span>
            <span className="text-foreground">-AM!</span>
          </h1>
          <p className="mt-3 text-lg text-subtext">
            Insider company talk. <span className="font-bold text-accent-2">Get paid to share.</span>
          </p>
        </div>

        {/* Bento Grid — Value Props + Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Staff-Only */}
          <div className="bento-card flex flex-col items-center justify-center py-5 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-2/15">
              <FiLock size={20} className="text-accent-2" />
            </div>
            <p className="text-sm font-bold text-heading">Staff-Only</p>
            <p className="mt-1 text-xs text-muted">Verified insider posts</p>
          </div>

          {/* Earn Revenue */}
          <div className="bento-card flex flex-col items-center justify-center py-5 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-positive/15">
              <FiDollarSign size={20} className="text-positive" />
            </div>
            <p className="text-sm font-bold text-heading">50% Revenue</p>
            <p className="mt-1 text-xs text-muted">Earn from every reader</p>
          </div>

          {/* Anonymous */}
          <div className="bento-card flex flex-col items-center justify-center py-5 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-3/15">
              <FiUsers size={20} className="text-accent-3" />
            </div>
            <p className="text-sm font-bold text-heading">Anonymous</p>
            <p className="mt-1 text-xs text-muted">Post under a codename</p>
          </div>

          {/* Platform Earnings — larger stat card */}
          <div className="bento-card flex flex-col items-center justify-center py-5 text-center">
            <p className="text-xs font-medium text-muted">Total Earned</p>
            <p className="stat-number mt-1 text-2xl font-black text-positive sm:text-3xl">
              ${totalPlatformEarnings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-muted">by insiders</p>
          </div>
        </div>

        {/* Top Earner + CTA row */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {topEarner && (
            <div className="flex items-center gap-3 rounded-xl border border-accent-2/20 bg-accent-2/5 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-2/20">
                <FiAward size={18} className="text-accent-2" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Top Earner This Month</p>
                <p className="text-sm font-bold text-heading">
                  {topEarner.name}{" "}
                  <span className="text-accent-2">${topEarner.amount.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}
          {!user && (
            <Link
              href="/login"
              className="btn-bounce inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20"
            >
              <FiZap size={16} />
              Join the Conversation
            </Link>
          )}
        </div>
      </div>

      {/* === SEARCH === */}
      <div className="relative mb-8">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
        <input
          type="text"
          placeholder="Search companies, names, brands, or links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-input-bg py-3.5 pl-11 pr-4 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
        />
      </div>

      {/* === COMPANY SECTIONS === */}
      <section className="mb-10">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-2/15">
              <FiBriefcase size={16} className="text-accent-2" />
            </div>
            <h2 className="text-xl font-black text-heading">Company Sections</h2>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <Link
                href="/sections/create"
                className="btn-bounce flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-accent/20"
              >
                <FiPlus size={14} />
                Create
              </Link>
            )}
            <Link
              href="/sections"
              className="btn-bounce flex items-center gap-1.5 rounded-xl border border-card-border px-3 py-2 text-xs font-bold text-subtext transition-colors hover:bg-surface hover:text-heading"
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-36 rounded-2xl" />
              ))}
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
                      className="btn-bounce inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 font-bold text-white shadow-lg shadow-accent/20"
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(sq ? filteredSections : filteredSections.slice(0, 6)).map((section, i) => (
                  <div key={section.id} className={`animate-slide-up stagger-${Math.min(i + 1, 6)}`}>
                    <SectionCard section={section} />
                  </div>
                ))}
              </div>
              {!sq && sections.length > 6 && (
                <div className="mt-4 text-center">
                  <Link href="/sections" className="text-sm font-bold text-accent-3 transition-colors hover:text-accent-3/80">
                    See all {sections.length} sections &rarr;
                  </Link>
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* === DIVIDER === */}
      <div className="divider-gradient mb-8" />

      {/* === REVIEWS FEED === */}
      <section>
        {/* Feed Header with Tabs */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
              <FiTrendingUp size={16} className="text-accent" />
            </div>
            <h2 className="text-xl font-black text-heading">
              {sort === "score" ? "Top Reviews" : "Latest Reviews"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Tabs */}
            <div className="flex rounded-xl border border-card-border bg-card-bg p-0.5">
              <button
                onClick={() => setSort("score")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  sort === "score"
                    ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-sm"
                    : "text-subtext hover:text-heading"
                }`}
              >
                <FiStar size={12} />
                Top
              </button>
              <button
                onClick={() => setSort("recent")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  sort === "recent"
                    ? "bg-gradient-to-r from-accent to-accent-2 text-white shadow-sm"
                    : "text-subtext hover:text-heading"
                }`}
              >
                <FiClock size={12} />
                New
              </button>
            </div>

            {/* Sentiment Filter */}
            <div className="flex items-center rounded-xl border border-card-border bg-card-bg p-0.5">
              <FiFilter size={12} className="mx-1.5 text-muted" />
              {(["all", "positive", "negative"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                    filter === f
                      ? f === "positive"
                        ? "bg-positive/20 text-positive"
                        : f === "negative"
                        ? "bg-negative/20 text-negative"
                        : "bg-gradient-to-r from-accent to-accent-2 text-white shadow-sm"
                      : "text-subtext hover:text-heading"
                  }`}
                >
                  {f === "all" ? "All" : f === "positive" ? "+" : "-"}
                </button>
              ))}
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
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-card-border bg-card-bg py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                <FiTrendingUp size={24} className="text-muted" />
              </div>
              <p className="mb-2 text-lg font-bold text-subtext">
                {searchQuery.trim() ? "No results found" : "No reviews yet"}
              </p>
              <p className="mb-5 text-sm text-muted">
                {searchQuery.trim()
                  ? `Nothing about "${searchQuery}" yet. Be the first!`
                  : "Be the first to speak up!"}
              </p>
              {!searchQuery.trim() && user && (
                <Link
                  href="/post/new"
                  className="btn-bounce inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 font-bold text-white shadow-lg shadow-accent/20"
                >
                  <FiPlus size={16} />
                  Create Review
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((post, index) => (
                <div key={post.id} className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
                  <PostCard
                    post={post}
                    rank={!searchQuery.trim() && sort === "score" ? index + 1 : undefined}
                    onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                  />
                </div>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
