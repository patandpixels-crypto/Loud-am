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
  FiMessageCircle, FiShare2,
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
  let id = localStorage.getItem("yarnam_anon_id");
  if (!id) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    id = "anon_" + hex;
    localStorage.setItem("yarnam_anon_id", id);
  }
  return id;
}

function getLocalVote(postId: string): "up" | "down" | null {
  if (typeof window === "undefined") return null;
  const votes = JSON.parse(localStorage.getItem("yarnam_votes") || "{}");
  return votes[postId] || null;
}

function setLocalVote(postId: string, voteType: "up" | "down" | null) {
  if (typeof window === "undefined") return;
  const votes = JSON.parse(localStorage.getItem("yarnam_votes") || "{}");
  if (voteType) {
    votes[postId] = voteType;
  } else {
    delete votes[postId];
  }
  localStorage.setItem("yarnam_votes", JSON.stringify(votes));
}

const REPORT_REASONS = [
  { value: "spam" as const, label: "Spam" },
  { value: "harassment" as const, label: "Harassment" },
  { value: "misinformation" as const, label: "Misinformation" },
  { value: "hate_speech" as const, label: "Hate Speech" },
  { value: "other" as const, label: "Other" },
];

const RANK_STYLES: Record<number, string> = {
  1: "bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-lg shadow-amber-500/20",
  2: "bg-gradient-to-br from-gray-300 to-gray-400 text-black",
  3: "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
};

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
  const [voteAnimating, setVoteAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAuthor = user?.uid === post.authorId;
  const timeAgo = getTimeAgo(post.createdAt);

  useEffect(() => {
    setUserVote(getLocalVote(post.id));
  }, [post.id]);

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
    setVoteAnimating(true);
    setTimeout(() => setVoteAnimating(false), 350);
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

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (post.hidden) return null;

  return (
    <>
      <div className="group rounded-2xl border border-card-border bg-card-bg transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
        <div className="flex gap-0 sm:gap-0">
          {/* Vote Column */}
          <div className="flex flex-col items-center gap-0.5 border-r border-card-border px-3 py-4 sm:px-4">
            {rank && rank <= 3 && (
              <span className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black ${RANK_STYLES[rank]}`}>
                {rank}
              </span>
            )}
            {rank && rank > 3 && (
              <span className="mb-2 text-xs font-bold text-muted">#{rank}</span>
            )}
            <button
              onClick={() => handleVote("up")}
              disabled={voting}
              className={`rounded-xl p-2 transition-all duration-200 ${
                userVote === "up"
                  ? "bg-positive/20 text-positive shadow-sm shadow-positive/20"
                  : "text-muted hover:bg-positive/10 hover:text-positive disabled:opacity-30"
              } ${voteAnimating && userVote === "up" ? "animate-vote-pop" : ""}`}
            >
              <FiArrowUp size={20} strokeWidth={userVote === "up" ? 3 : 2} />
            </button>
            <span
              className={`stat-number text-sm font-black transition-all duration-200 ${
                score > 0 ? "text-positive" : score < 0 ? "text-negative" : "text-subtext"
              } ${voteAnimating ? "animate-score-bump" : ""}`}
            >
              {score}
            </span>
            <button
              onClick={() => handleVote("down")}
              disabled={voting}
              className={`rounded-xl p-2 transition-all duration-200 ${
                userVote === "down"
                  ? "bg-negative/20 text-negative shadow-sm shadow-negative/20"
                  : "text-muted hover:bg-negative/10 hover:text-negative disabled:opacity-30"
              } ${voteAnimating && userVote === "down" ? "animate-vote-pop" : ""}`}
            >
              <FiArrowDown size={20} strokeWidth={userVote === "down" ? 3 : 2} />
            </button>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            {/* Top row: badges + menu */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  post.sentiment === "positive"
                    ? "bg-positive/10 text-positive"
                    : "bg-negative/10 text-negative"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${post.sentiment === "positive" ? "bg-positive" : "bg-negative"}`} />
                {post.sentiment === "positive" ? "Positive" : "Negative"}
              </span>
              <span className="rounded-lg bg-accent-3/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-accent-3">
                {post.targetType === "person" ? "Person" : "Brand"}
              </span>
              {post.editedAt && (
                <span className="text-[11px] italic text-muted">(edited)</span>
              )}

              {/* Actions menu */}
              <div className="relative ml-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="rounded-lg p-1.5 text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-surface hover:text-subtext"
                >
                  <FiMoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div className="animate-fade-in absolute right-0 top-8 z-30 min-w-[160px] rounded-xl border border-card-border bg-card-bg py-1 shadow-xl">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            router.push(`/post/${post.id}/edit`);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-subtext hover:bg-surface hover:text-heading"
                        >
                          <FiEdit2 size={14} />
                          Edit Post
                        </button>
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            setShowDeleteConfirm(true);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-negative hover:bg-negative/10"
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
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-subtext hover:bg-surface hover:text-accent"
                      >
                        <FiFlag size={14} />
                        Report
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <Link href={`/post/${post.id}`} className="block">
              <h3 className="mb-1.5 text-base font-bold leading-snug text-heading transition-colors group-hover:text-accent sm:text-lg">
                {post.title}
              </h3>
            </Link>

            {/* Target */}
            <p className="mb-2 text-sm font-semibold text-accent-2">
              About: {post.targetName}
            </p>

            {/* Content preview */}
            <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-subtext">
              {post.content}
            </p>

            {/* Links */}
            {post.targetLinks.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {post.targetLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.startsWith("http") ? link : `https://${link}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-accent-3/8 px-2 py-1 text-xs text-accent-3 transition-colors hover:bg-accent-3/15"
                  >
                    <FiExternalLink size={11} />
                    {link.length > 30 ? link.substring(0, 30) + "..." : link}
                  </a>
                ))}
              </div>
            )}

            {/* Footer: author + engagement */}
            <div className="flex items-center justify-between gap-2 border-t border-card-border/50 pt-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface">
                  <FiUser size={10} className="text-subtext" />
                </div>
                <span className="font-medium">{post.isAnonymous ? "Anonymous" : post.authorName}</span>
                <span className="text-card-border">&middot;</span>
                <span>{timeAgo}</span>
              </div>

              {/* Engagement actions */}
              <div className="flex items-center gap-1">
                <Link
                  href={`/post/${post.id}`}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-accent-3"
                >
                  <FiMessageCircle size={13} />
                  <span className="hidden sm:inline">Reply</span>
                </Link>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface hover:text-accent"
                >
                  <FiShare2 size={13} />
                  <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-negative/10">
              <FiTrash2 size={20} className="text-negative" />
            </div>
            <h3 className="mb-2 text-center text-lg font-bold">Delete this post?</h3>
            <p className="mb-5 text-center text-sm text-subtext">
              This will permanently delete your post and all associated votes. This cannot be undone.
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
          <div className="animate-slide-up w-full max-w-sm rounded-2xl border border-card-border bg-card-bg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {reportSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-positive/20">
                  <FiFlag size={20} className="text-positive" />
                </div>
                <p className="font-bold">Report submitted</p>
                <p className="mt-1 text-sm text-subtext">Thanks for reporting. Our team will review this shortly.</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Report Post</h3>
                  <button onClick={() => setShowReportModal(false)} className="rounded-lg p-1 text-muted transition-colors hover:bg-surface hover:text-heading">
                    <FiX size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-subtle">Reason</label>
                    <div className="flex flex-wrap gap-2">
                      {REPORT_REASONS.map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setReportReason(r.value)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                            reportReason === r.value
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-card-border text-subtext hover:border-muted"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-subtle">Details (optional)</label>
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
