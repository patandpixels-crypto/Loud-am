"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";
import PostCard from "@/components/PostCard";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", params.id as string));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
        }
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-xl font-bold text-zinc-400">Post not found</p>
        <button
          onClick={() => router.push("/")}
          className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="btn-bounce mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-accent-3"
      >
        <FiArrowLeft size={16} />
        Back to Leaderboard
      </Link>

      <PostCard post={post} />

      {/* Full content section */}
      <div className="card-glow mt-4 rounded-2xl border border-card-border bg-card-bg p-6">
        <h2 className="mb-3 text-lg font-bold">Full Review</h2>
        <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">
          {post.content}
        </p>

        {post.targetLinks.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-bold text-zinc-400">Related Links</h3>
            <div className="space-y-2">
              {post.targetLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.startsWith("http") ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-accent-3 hover:text-accent-3/80"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
