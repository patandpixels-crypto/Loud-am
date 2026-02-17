"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post } from "@/lib/types";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { FiUser, FiCalendar, FiPlus } from "react-icons/fi";

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchUserPosts = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
        fetched.sort((a, b) => b.createdAt - a.createdAt);
        setPosts(fetched);
      } catch (err) {
        console.error("Error fetching user posts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPosts();
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Sign in to view your profile.</p>
        <Link
          href="/login"
          className="rounded-full bg-accent px-6 py-2 font-semibold text-white hover:bg-accent-hover"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Profile Card */}
      <div className="mb-6 rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
            <FiUser size={28} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.displayName || "User"}</h1>
            <p className="text-sm text-zinc-400">{user.email}</p>
            {userProfile && (
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                <FiCalendar size={12} />
                Joined {new Date(userProfile.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-bold">{posts.length}</p>
          <p className="text-xs text-zinc-400">Posts</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-bold text-positive">
            {posts.filter((p) => p.sentiment === "positive").length}
          </p>
          <p className="text-xs text-zinc-400">Positive</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-bold text-negative">
            {posts.filter((p) => p.sentiment === "negative").length}
          </p>
          <p className="text-xs text-zinc-400">Negative</p>
        </div>
      </div>

      {/* User's Posts */}
      <h2 className="mb-4 text-lg font-bold">Your Posts</h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card-bg py-12 text-center">
          <p className="mb-2 text-zinc-300">You haven&apos;t posted anything yet.</p>
          <Link
            href="/post/new"
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 font-semibold text-white hover:bg-accent-hover"
          >
            <FiPlus size={16} />
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
