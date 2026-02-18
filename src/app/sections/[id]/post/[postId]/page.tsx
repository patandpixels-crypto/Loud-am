"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CompanySection, SectionPost, SectionReply } from "@/lib/types";
import { FiArrowLeft, FiUser, FiSend, FiLock, FiDollarSign } from "react-icons/fi";

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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function SectionPostPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const postId = params.postId as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  const [section, setSection] = useState<CompanySection | null>(null);
  const [post, setPost] = useState<SectionPost | null>(null);
  const [replies, setReplies] = useState<SectionReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState("");

  // Payment state
  const [paying, setPaying] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch section
        const sectionSnap = await getDoc(doc(db, "companySections", sectionId));
        if (!sectionSnap.exists()) {
          setLoading(false);
          return;
        }
        const sectionData = { id: sectionSnap.id, ...sectionSnap.data() } as CompanySection;
        setSection(sectionData);

        // Check staff/access
        const staff =
          user &&
          (sectionData.staffIds.includes(user.uid) ||
            sectionData.staffEmails.includes(user.email?.toLowerCase() || ""));
        setIsStaff(!!staff);

        if (staff) {
          setHasAccess(true);
        } else if (user) {
          const accessQuery = query(
            collection(db, "sectionAccess"),
            where("userId", "==", user.uid)
          );
          const accessSnap = await getDocs(accessQuery);
          const hasPaid = accessSnap.docs.some((d) => d.data().sectionId === sectionId);
          if (hasPaid) setHasAccess(true);
        }

        // Fetch post
        const postSnap = await getDoc(doc(db, "sectionPosts", postId));
        if (!postSnap.exists()) {
          setLoading(false);
          return;
        }
        setPost({ id: postSnap.id, ...postSnap.data() } as SectionPost);

        // Fetch replies
        const repliesQuery = query(
          collection(db, "sectionReplies"),
          where("postId", "==", postId)
        );
        const repliesSnap = await getDocs(repliesQuery);
        const fetchedReplies = repliesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as SectionReply[];
        fetchedReplies.sort((a, b) => a.createdAt - b.createdAt);
        setReplies(fetchedReplies);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchData();
  }, [sectionId, postId, user, authLoading]);

  const handlePayment = async () => {
    if (!user) return;
    setPaying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await addDoc(collection(db, "sectionAccess"), {
        sectionId,
        userId: user.uid,
        paidAt: Date.now(),
        amount: 3,
      });

      // Distribute 50% ($1.50) of the payment to section post authors
      try {
        const sectionPostsQuery = query(
          collection(db, "sectionPosts"),
          where("sectionId", "==", sectionId)
        );
        const sectionPostsSnap = await getDocs(sectionPostsQuery);

        if (!sectionPostsSnap.empty) {
          const revenueShare = 1.5; // 50% of $3
          const perPost = revenueShare / sectionPostsSnap.size;

          for (const pd of sectionPostsSnap.docs) {
            const pData = pd.data();
            if (pData.authorId !== user.uid) {
              await addDoc(collection(db, "earnings"), {
                userId: pData.authorId,
                sectionId,
                sectionPostId: pd.id,
                fromPaymentBy: user.uid,
                amount: Math.round(perPost * 100) / 100,
                createdAt: Date.now(),
              });
            }
          }
        }
      } catch (err) {
        console.error("Error distributing earnings:", err);
      }

      setHasAccess(true);
      setShowPaywall(false);
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setPaying(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    const wordCount = countWords(replyContent);
    if (wordCount === 0) {
      setReplyError("Reply cannot be empty");
      return;
    }
    if (!isStaff && wordCount > 200) {
      setReplyError(`Reply must be 200 words or less (currently ${wordCount} words)`);
      return;
    }

    setSubmittingReply(true);
    setReplyError("");

    try {
      const newReply = {
        postId,
        sectionId,
        content: replyContent.trim(),
        authorId: user.uid,
        authorName: userProfile.codeName || userProfile.displayName,
        isPaidUser: !isStaff,
        createdAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, "sectionReplies"), newReply);

      // Update reply count
      await updateDoc(doc(db, "sectionPosts", postId), {
        replyCount: increment(1),
      });

      setReplies([...replies, { id: docRef.id, ...newReply }]);
      setReplyContent("");
    } catch (err) {
      console.error("Error posting reply:", err);
      setReplyError("Failed to post reply. Please try again.");
    } finally {
      setSubmittingReply(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!section || !post) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-zinc-400">Post not found</p>
        <Link href="/sections" className="text-accent hover:underline">Back to sections</Link>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <FiLock className="text-zinc-500" size={32} />
        <p className="text-lg text-zinc-400">Sign in to view this post</p>
        <Link href="/login" className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white">
          Sign In
        </Link>
      </div>
    );
  }

  // No access — paywall
  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href={`/sections/${sectionId}`}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <FiArrowLeft size={16} />
          Back to {section.companyName}
        </Link>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-card-border bg-card-bg py-16">
          <FiLock className="mb-4 text-accent" size={40} />
          <h2 className="mb-2 text-xl font-bold text-white">Unlock This Post</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Pay <strong className="text-accent">$3</strong> to read posts and reply in {section.companyName}
          </p>
          {showPaywall ? (
            <div className="w-full max-w-sm px-6">
              <div className="rounded-xl border border-card-border bg-input-bg p-6">
                <div className="mb-4 rounded-lg bg-zinc-800 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Section access</span>
                    <span className="font-bold text-white">$3.00</span>
                  </div>
                </div>
                <div className="mb-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Card number"
                    className="w-full rounded-lg border border-card-border bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
                    maxLength={19}
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-1/2 rounded-lg border border-card-border bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
                      maxLength={5}
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-1/2 rounded-lg border border-card-border bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
                      maxLength={4}
                    />
                  </div>
                </div>
                <button
                  onClick={handlePayment}
                  disabled={paying}
                  className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {paying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FiDollarSign size={16} />
                      Pay $3.00
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="mt-3 w-full text-center text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPaywall(true)}
              className="flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
            >
              <FiDollarSign size={16} />
              Unlock for $3
            </button>
          )}
        </div>
      </div>
    );
  }

  const wordCount = countWords(replyContent);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={`/sections/${sectionId}`}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <FiArrowLeft size={16} />
        Back to {section.companyName}
      </Link>

      {/* Post */}
      <article className="mb-8 rounded-2xl border border-card-border bg-card-bg p-6 sm:p-8">
        <h1 className="mb-3 text-2xl font-black leading-tight text-white">{post.title}</h1>
        <div className="mb-4 flex items-center gap-3 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <FiUser size={14} />
            {post.isAnonymous ? "Anonymous Staff" : post.authorName}
          </span>
          <span>{getTimeAgo(post.createdAt)}</span>
          {isStaff && (
            <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-semibold text-positive">
              Staff
            </span>
          )}
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {post.content}
        </div>
      </article>

      {/* Replies */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-bold text-white">
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <p className="text-sm text-zinc-500">No replies yet. Be the first to reply!</p>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-xl border border-card-border bg-card-bg p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-xs text-zinc-500">
                  <FiUser size={12} />
                  <span className="font-medium text-zinc-300">{reply.authorName}</span>
                  {reply.isPaidUser && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-xs text-accent">
                      Paid
                    </span>
                  )}
                  <span>{getTimeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">{reply.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      {hasAccess && (
        <form onSubmit={handleReply} className="rounded-2xl border border-card-border bg-card-bg p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Write a Reply</h3>
            {!isStaff && (
              <span
                className={`text-xs ${wordCount > 200 ? "text-negative" : "text-zinc-500"}`}
              >
                {wordCount}/200 words
              </span>
            )}
          </div>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={
              isStaff
                ? "Reply as staff..."
                : "Write your reply (max 200 words)..."
            }
            rows={4}
            className="mb-3 w-full resize-none rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
          />
          {replyError && (
            <p className="mb-3 rounded-lg bg-negative/10 px-4 py-2 text-sm text-negative">
              {replyError}
            </p>
          )}
          <button
            type="submit"
            disabled={submittingReply || wordCount === 0}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            <FiSend size={14} />
            {submittingReply ? "Posting..." : "Post Reply"}
          </button>
        </form>
      )}
    </div>
  );
}
