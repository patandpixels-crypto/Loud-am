"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post, UserProfile } from "@/lib/types";
import { FiShield, FiUser, FiMail, FiEyeOff, FiEye } from "react-icons/fi";
import Link from "next/link";

interface PostWithAuthor extends Post {
  authorEmail?: string;
  authorProfile?: UserProfile;
}

export default function AdminPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile?.isAdmin) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      try {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        const postsWithAuthors: PostWithAuthor[] = await Promise.all(
          snapshot.docs.map(async (postDoc) => {
            const postData = { id: postDoc.id, ...postDoc.data() } as PostWithAuthor;
            try {
              const userDoc = await getDoc(doc(db, "users", postData.authorId));
              if (userDoc.exists()) {
                postData.authorProfile = userDoc.data() as UserProfile;
                postData.authorEmail = postData.authorProfile.email;
              }
            } catch {
              // Skip if user profile fetch fails
            }
            return postData;
          })
        );

        setPosts(postsWithAuthors);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [authLoading, userProfile]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  if (!user || !userProfile?.isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <FiShield size={48} className="text-zinc-600" />
        <p className="text-xl font-bold text-zinc-400">Admin Access Required</p>
        <p className="text-sm text-zinc-500">You don&apos;t have permission to view this page.</p>
        <Link
          href="/"
          className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <FiShield size={24} className="text-accent-2" />
        <h1 className="text-2xl font-black">
          <span className="gradient-text">Admin Dashboard</span>
        </h1>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-zinc-400">Total Posts</p>
          <p className="text-3xl font-black">{posts.length}</p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-zinc-400">Anonymous Posts</p>
          <p className="text-3xl font-black text-accent-2">
            {posts.filter((p) => p.isAnonymous).length}
          </p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-zinc-400">Public Posts</p>
          <p className="text-3xl font-black text-positive">
            {posts.filter((p) => !p.isAnonymous).length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-card-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-card-border bg-card-bg">
              <tr>
                <th className="px-4 py-3 font-bold text-zinc-300">Post</th>
                <th className="px-4 py-3 font-bold text-zinc-300">About</th>
                <th className="px-4 py-3 font-bold text-zinc-300">Author Identity</th>
                <th className="px-4 py-3 font-bold text-zinc-300">Type</th>
                <th className="px-4 py-3 font-bold text-zinc-300">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {posts.map((post) => (
                <tr key={post.id} className="transition-colors hover:bg-card-bg/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/post/${post.id}`}
                      className="font-medium text-white hover:text-accent"
                    >
                      {post.title.length > 40
                        ? post.title.substring(0, 40) + "..."
                        : post.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{post.targetName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        {post.isAnonymous ? (
                          <FiEyeOff size={14} className="text-accent-2" />
                        ) : (
                          <FiEye size={14} className="text-positive" />
                        )}
                        <span className="flex items-center gap-1 text-zinc-300">
                          <FiUser size={12} />
                          {post.authorProfile?.displayName || post.authorName}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <FiMail size={10} />
                        {post.authorEmail || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        post.sentiment === "positive"
                          ? "bg-positive/10 text-positive"
                          : "bg-negative/10 text-negative"
                      }`}
                    >
                      {post.sentiment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-black ${
                        post.score > 0
                          ? "text-positive"
                          : post.score < 0
                          ? "text-negative"
                          : "text-zinc-400"
                      }`}
                    >
                      {post.score > 0 ? "+" : ""}
                      {post.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
