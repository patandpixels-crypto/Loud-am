"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post } from "@/lib/types";
import { FiArrowUp, FiArrowDown, FiUser, FiExternalLink } from "react-icons/fi";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";

interface PostCardProps {
  post: Post;
  rank?: number;
}

function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("loud_anon_id");
  if (!id) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    id = "anon_" + hex;
    localStorage.setItem("loud_anon_id", id);
  }
  return id;
}

function getLocalVote(postId: string): "up" | "down" | null {
  if (typeof window === "undefined") return null;
  const votes = JSON.parse(localStorage.getItem("loud_votes") || "{}");
  return votes[postId] || null;
}

function setLocalVote(postId: string, voteType: "up" | "down" | null) {
  if (typeof window === "undefined") return;
  const votes = JSON.parse(localStorage.getItem("loud_votes") || "{}");
  if (voteType) {
    votes[postId] = voteType;
  } else {
    delete votes[postId];
  }
  localStorage.setItem("loud_votes", JSON.stringify(votes));
}

export default function PostCard({ post, rank }: PostCardProps) {
  const { user } = useAuth();
  const [score, setScore] = useState(post.score);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [voting, setVoting] = useState(false);

  const timeAgo = getTimeAgo(post.createdAt);

  // Load existing vote from localStorage on mount
  useEffect(() => {
    setUserVote(getLocalVote(post.id));
  }, [post.id]);

  const handleVote = async (voteType: "up" | "down") => {
    if (voting) return;
    setVoting(true);

    const voterId = user?.uid || getAnonId();

    try {
      const votesRef = collection(db, "votes");
      const q = query(votesRef, where("postId", "==", post.id), where("voterId", "==", voterId));
      const existingVotes = await getDocs(q);

      const postRef = doc(db, "posts", post.id);

      if (!existingVotes.empty) {
        const existingVote = existingVotes.docs[0];
        const existingVoteType = existingVote.data().voteType;

        if (existingVoteType === voteType) {
          // Remove vote
          await deleteDoc(existingVote.ref);
          await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) return;
            const data = postDoc.data();
            const updates = voteType === "up"
              ? { upvotes: data.upvotes - 1, score: data.score - 1 }
              : { downvotes: data.downvotes - 1, score: data.score + 1 };
            transaction.update(postRef, updates);
          });
          setScore((prev) => voteType === "up" ? prev - 1 : prev + 1);
          setUserVote(null);
          setLocalVote(post.id, null);
        } else {
          // Switch vote
          await deleteDoc(existingVote.ref);
          await addDoc(votesRef, { postId: post.id, voterId: voterId, userId: user?.uid || "", voteType });
          await runTransaction(db, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) return;
            const data = postDoc.data();
            const updates = voteType === "up"
              ? { upvotes: data.upvotes + 1, downvotes: data.downvotes - 1, score: data.score + 2 }
              : { upvotes: data.upvotes - 1, downvotes: data.downvotes + 1, score: data.score - 2 };
            transaction.update(postRef, updates);
          });
          setScore((prev) => voteType === "up" ? prev + 2 : prev - 2);
          setUserVote(voteType);
          setLocalVote(post.id, voteType);
        }
      } else {
        // New vote
        await addDoc(votesRef, { postId: post.id, voterId: voterId, userId: user?.uid || "", voteType });
        await runTransaction(db, async (transaction) => {
          const postDoc = await transaction.get(postRef);
          if (!postDoc.exists()) return;
          const data = postDoc.data();
          const updates = voteType === "up"
            ? { upvotes: data.upvotes + 1, score: data.score + 1 }
            : { downvotes: data.downvotes + 1, score: data.score - 1 };
          transaction.update(postRef, updates);
        });
        setScore((prev) => voteType === "up" ? prev + 1 : prev - 1);
        setUserVote(voteType);
        setLocalVote(post.id, voteType);
      }
    } catch (err) {
      console.error("Vote error:", err);
      // Fallback: just update locally if Firestore fails for anon users
      if (!user) {
        const currentVote = getLocalVote(post.id);
        if (currentVote === voteType) {
          setScore((prev) => voteType === "up" ? prev - 1 : prev + 1);
          setUserVote(null);
          setLocalVote(post.id, null);
        } else if (currentVote) {
          setScore((prev) => voteType === "up" ? prev + 2 : prev - 2);
          setUserVote(voteType);
          setLocalVote(post.id, voteType);
        } else {
          setScore((prev) => voteType === "up" ? prev + 1 : prev - 1);
          setUserVote(voteType);
          setLocalVote(post.id, voteType);
        }
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="card-glow group rounded-2xl border border-card-border bg-card-bg">
      <div className="flex gap-3 p-4 sm:p-5">
        {/* Vote Column */}
        <div className="flex flex-col items-center gap-1">
          {rank && (
            <span className={`mb-1 text-xs font-black ${rank <= 3 ? "text-accent-2" : "text-muted"}`}>
              #{rank}
            </span>
          )}
          <button
            onClick={() => handleVote("up")}
            disabled={voting}
            className={`btn-bounce rounded-xl p-1.5 ${
              userVote === "up"
                ? "bg-positive/20 text-positive shadow-sm shadow-positive/20"
                : "text-muted hover:bg-positive/10 hover:text-positive disabled:opacity-30"
            }`}
          >
            <FiArrowUp size={20} />
          </button>
          <span
            className={`text-sm font-black ${
              score > 0 ? "text-positive" : score < 0 ? "text-negative" : "text-subtext"
            }`}
          >
            {score}
          </span>
          <button
            onClick={() => handleVote("down")}
            disabled={voting}
            className={`btn-bounce rounded-xl p-1.5 ${
              userVote === "down"
                ? "bg-negative/20 text-negative shadow-sm shadow-negative/20"
                : "text-muted hover:bg-negative/10 hover:text-negative disabled:opacity-30"
            }`}
          >
            <FiArrowDown size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                post.sentiment === "positive"
                  ? "bg-positive/10 text-positive"
                  : "bg-negative/10 text-negative"
              }`}
            >
              {post.sentiment === "positive" ? "Positive" : "Negative"}
            </span>
            <span className="rounded-full bg-accent-3/10 px-2.5 py-0.5 text-xs font-medium text-accent-3">
              {post.targetType === "person" ? "Person" : "Brand"}
            </span>
          </div>

          <Link href={`/post/${post.id}`} className="block">
            <h3 className="mb-1 text-lg font-bold leading-snug text-heading transition-colors group-hover:text-accent">
              {post.title}
            </h3>
          </Link>

          <p className="mb-2 text-sm font-semibold text-accent-2">
            About: {post.targetName}
          </p>

          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-subtext">
            {post.content}
          </p>

          {post.targetLinks.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {post.targetLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.startsWith("http") ? link : `https://${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-bounce flex items-center gap-1 rounded-full bg-accent-3/10 px-2.5 py-1 text-xs text-accent-3 hover:bg-accent-3/20"
                >
                  <FiExternalLink size={12} />
                  {link.length > 30 ? link.substring(0, 30) + "..." : link}
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted">
            <FiUser size={12} />
            <span>{post.isAnonymous ? "Anonymous" : post.authorName}</span>
            <span className="text-accent-2">&middot;</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
