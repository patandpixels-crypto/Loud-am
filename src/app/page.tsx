"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post, Earning } from "@/lib/types";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { FiTrendingUp, FiPlus, FiFilter, FiSearch, FiAward } from "react-icons/fi";

type FilterType = "all" | "positive" | "negative";
type SortType = "score" | "recent";

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [topEarner, setTopEarner] = useState<{ name: string; amount: number } | null>(null);

  // Fetch top earner of the month
  useEffect(() => {
    const fetchTopEarner = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        const earningsSnap = await getDocs(collection(db, "earnings"));
        const monthEarnings = earningsSnap.docs
          .map((d) => d.data() as Earning)
          .filter((e) => e.createdAt >= monthStart);

        if (monthEarnings.length === 0) return;

        // Aggregate by userId
        const totals: Record<string, number> = {};
        for (const e of monthEarnings) {
          totals[e.userId] = (totals[e.userId] || 0) + e.amount;
        }

        // Find the top earner
        let topUserId = "";
        let topAmount = 0;
        for (const [uid, amount] of Object.entries(totals)) {
          if (amount > topAmount) {
            topUserId = uid;
            topAmount = amount;
          }
        }

        if (!topUserId) return;

        // Get their codename
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
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsRef = collection(db, "posts");
        const snapshot = await getDocs(postsRef);
        let fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Post[];

        // Filter client-side
        if (filter !== "all") {
          fetchedPosts = fetchedPosts.filter((p) => p.sentiment === filter);
        }

        // Sort client-side
        if (sort === "score") {
          fetchedPosts.sort((a, b) => b.score - a.score);
        } else {
          fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
        }

        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [filter, sort]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-black sm:text-5xl">
          <span className="text-accent">LOUD</span>
          <span className="text-foreground">-AM!</span>
        </h1>
        <p className="mt-2 text-zinc-400">
          Speak your truth about people and brands. Be heard.
        </p>
        {!user && (
          <Link
            href="/login"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Join the Conversation
          </Link>
        )}

        {/* Top Earner of the Month */}
        {topEarner && (
          <div className="mx-auto mt-5 flex max-w-sm items-center gap-3 rounded-xl border border-positive/20 bg-positive/5 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-positive/20">
              <FiAward size={18} className="text-positive" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-zinc-400">Top Earner This Month</p>
              <p className="text-sm font-bold text-white">
                {topEarner.name}{" "}
                <span className="text-positive">${topEarner.amount.toFixed(2)}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input
          type="text"
          placeholder="Search by name, brand, or social media link..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-input-bg py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
        />
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
          {/* Sort Toggle */}
          <div className="flex overflow-hidden rounded-lg border border-card-border">
            <button
              onClick={() => setSort("score")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === "score"
                  ? "bg-accent text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Top
            </button>
            <button
              onClick={() => setSort("recent")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === "recent"
                  ? "bg-accent text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              New
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 overflow-hidden rounded-lg border border-card-border">
            <FiFilter size={14} className="ml-2 text-zinc-500" />
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                filter === "all"
                  ? "bg-accent text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("positive")}
              className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                filter === "positive"
                  ? "bg-positive text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              +
            </button>
            <button
              onClick={() => setFilter("negative")}
              className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                filter === "negative"
                  ? "bg-negative text-white"
                  : "text-zinc-400 hover:text-white"
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-card-bg py-16 text-center">
            <p className="mb-2 text-xl font-bold text-zinc-300">
              {searchQuery.trim() ? "No results found" : "No posts yet"}
            </p>
            <p className="mb-4 text-zinc-500">
              {searchQuery.trim()
                ? `No posts about "${searchQuery}" found.`
                : "Be the first to speak up!"}
            </p>
            {!searchQuery.trim() && user && (
              <Link
                href="/post/new"
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-hover"
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
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}
