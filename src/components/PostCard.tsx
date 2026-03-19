"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { doc, runTransaction, deleteDoc as firestoreDeleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post } from "@/lib/types";
import {
  FiArrowUp, FiArrowDown, FiUser, FiExternalLink,
  FiFlag, FiEdit2, FiTrash2, FiMoreHorizontal, FiX,
} from "react-icons/fi";
import { collection, query, where, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { checkRateLimit, recordAction } from "@/lib/rateLimit";

interface PostCardProps {
  post: Post;
  rank?: number;
  onDelete?: (postId: string) => void;
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

const REPORT_REASONS = [
  { value: "spam" as const, label: "Spam" },
  { value: "harassment" as const, label: "Harassment" },
  { value: "misinformation" as const, label: "Misinformation" },
  { value: "hate_speech" as const, label: "Hate Speech" },
  { value: "other" as const, label: "Other" },
];

export default function PostCard({ post, rank, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [score, setScore] = useState(post.score || 0);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [voting, setVoting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportReason, setReportReason] = useState<"spam" | "harassment" | "misinformation" | "hate_speech" | "other">("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user?.uid === post.authorId;
  const timeAgo = getTimeAgo(post.createdAt);

  useEffect(() => {
    setUserVote(getLocalVote(post.id));
  }, [post.id]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = () => setShowMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showMenu]);

  const handleVote = async (voteType: "up" | "down") => {
    if (voting) return;

    const limit = checkRateLimit("vote");
    if (!limit.allowed) return;

    setVoting(true);
    recordAction("vote");

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
          await deleteDoc(existingVote.ref);
          await addDoc(votesRef, { postId: post.id, voterId, userId: user?.uid || "", voteType });
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
        await addDoc(votesRef, { postId: post.id, voterId, userId: user?.uid || "", voteType });
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

  const handleReport = async () => {
    if (!user || reportSubmitting) return;

    const limit = checkRateLimit("report");
    if (!limit.allowed) return;

    setReportSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        postId: post.id,
        postTitle: post.title,
        reporterId: user.uid,
        reason: reportReason,
        details: reportDetails.trim() || null,
        status: "pending",
        createdAt: Date.now(),
      });
      recordAction("report");
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportDetails("");
      }, 2000);
    } catch {
      // silent
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !isAuthor || deleting) return;
    setDeleting(true);
    try {
      await firestoreDeleteDoc(doc(db, "posts", post.id));
      onDelete?.(post.id);
    } catch {
      setDeleting(false);
    }
  };

  if (post.hidden) return null;

  return (
    <>
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
              {post.editedAt && (
                <span className="text-xs text-muted">(edited)</span>
              )}

              {/* Actions menu */}
              <div className="relative ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="rounded-lg p-1 text-muted transition-colors hover:bg-surface hover:text-subtext"
                >
                  <FiMoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 z-30 min-w-[160px] rounded-xl border border-card-border bg-card-bg py-1 shadow-xl">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            router.push(`/post/${post.id}/edit`);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-subtext hover:bg-surface hover:text-heading"
                        >
                          <FiEdit2 size={14} />
                          Edit Post
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-negative hover:bg-negative/10"
                        >
                          <FiTrash2 size={14} />
                          Delete Post
                        </button>
                      </>
                    )}
                    {user && !isAuthor && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowReportModal(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-subtext hover:bg-surface hover:text-accent"
                      >
                        <FiFlag size={14} />
                        Report
                      </button>
                    )}
                  </div>
                )}
              </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card-bg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-2 text-lg font-bold">Delete this post?</h3>
            <p className="mb-5 text-sm text-subtext">
              This action cannot be undone. Your post and all its votes will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-bounce flex-1 rounded-xl border border-card-border px-4 py-2.5 text-sm font-bold text-subtext hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="btn-bounce flex-1 rounded-xl bg-negative px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" onClick={() => setShowReportModal(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-card-border bg-card-bg p-6" onClick={(e) => e.stopPropagation()}>
            {reportSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-positive/20">
                  <FiFlag size={20} className="text-positive" />
                </div>
                <p className="font-bold">Report submitted</p>
                <p className="mt-1 text-sm text-subtext">We&apos;ll review this post.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Report Post</h3>
                  <button onClick={() => setShowReportModal(false)} className="text-muted hover:text-heading">
                    <FiX size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-subtle">Reason</label>
                    <div className="flex flex-wrap gap-2">
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setReportReason(r.value)}
                          className={`btn-bounce rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${
                            reportReason === r.value
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-card-border text-subtext hover:border-zinc-500"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-subtle">Details (optional)</label>
                    <textarea
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      className="min-h-[80px] w-full resize-none rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                      placeholder="Tell us more..."
                      maxLength={500}
                    />
                  </div>
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitting}
                    className="btn-bounce w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 disabled:opacity-50"
                  >
                    {reportSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
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
