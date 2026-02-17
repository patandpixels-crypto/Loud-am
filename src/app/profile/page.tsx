"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post, SectionPost } from "@/lib/types";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import { FiUser, FiCalendar, FiPlus, FiBriefcase } from "react-icons/fi";

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sectionPosts, setSectionPosts] = useState<SectionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchUserPosts = async () => {
      try {
        // Fetch homepage posts
        const postsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid)
        );
        const postsSnap = await getDocs(postsQuery);
        const fetchedPosts = postsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
        fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
        setPosts(fetchedPosts);

        // Fetch section posts
        const sectionQuery = query(
          collection(db, "sectionPosts"),
          where("authorId", "==", user.uid)
        );
        const sectionSnap = await getDocs(sectionQuery);
        const fetchedSectionPosts = sectionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as SectionPost[];
        fetchedSectionPosts.sort((a, b) => b.createdAt - a.createdAt);
        setSectionPosts(fetchedSectionPosts);
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

  const totalPosts = posts.length + sectionPosts.length;

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
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-bold">{totalPosts}</p>
          <p className="text-xs text-zinc-400">Total Posts</p>
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
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-bold text-accent">{sectionPosts.length}</p>
          <p className="text-xs text-zinc-400">Section</p>
        </div>
      </div>

      {/* User's Posts */}
      <h2 className="mb-4 text-lg font-bold">Your Posts</h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : posts.length === 0 && sectionPosts.length === 0 ? (
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

          {/* Section Posts */}
          {sectionPosts.length > 0 && (
            <>
              {posts.length > 0 && (
                <div className="flex items-center gap-2 pt-4">
                  <FiBriefcase size={16} className="text-accent" />
                  <h3 className="text-sm font-semibold text-zinc-400">Section Posts</h3>
                </div>
              )}
              {sectionPosts.map((sp) => (
                <Link
                  key={sp.id}
                  href={`/sections/${sp.sectionId}/post/${sp.id}`}
                  className="block"
                >
                  <div className="group rounded-2xl border border-card-border bg-card-bg p-5 transition-colors hover:border-zinc-600">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                        Section
                      </span>
                    </div>
                    <h3 className="mb-1 text-lg font-bold leading-snug text-white group-hover:text-accent">
                      {sp.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
                      {sp.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <FiUser size={12} />
                      <span>{sp.isAnonymous ? "Anonymous" : sp.authorName}</span>
                      <span>&middot;</span>
                      <span>{getTimeAgo(sp.createdAt)}</span>
                      <span>&middot;</span>
                      <span>{sp.replyCount} {sp.replyCount === 1 ? "reply" : "replies"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
