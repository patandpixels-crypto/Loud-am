"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, addDoc, collection, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CompanySection } from "@/lib/types";
import { FiArrowLeft, FiEyeOff } from "react-icons/fi";

export default function NewSectionPostPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [section, setSection] = useState<CompanySection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const docSnap = await getDoc(doc(db, "companySections", sectionId));
        if (!docSnap.exists()) {
          setLoading(false);
          return;
        }
        const data = { id: docSnap.id, ...docSnap.data() } as CompanySection;
        setSection(data);

        if (user) {
          const staff =
            data.staffIds.includes(user.uid) ||
            data.staffEmails.includes(user.email?.toLowerCase() || "");
          setIsStaff(staff);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchSection();
    }
  }, [sectionId, user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile || !section) return;

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, "sectionPosts"), {
        sectionId,
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        authorName: userProfile.displayName,
        isAnonymous,
        replyCount: 0,
        createdAt: Date.now(),
      });

      // Increment post count
      await updateDoc(doc(db, "companySections", sectionId), {
        postCount: increment(1),
      });

      router.refresh();
      router.push(`/sections/${sectionId}`);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-zinc-400">Section not found</p>
        <Link href="/sections" className="text-accent hover:underline">Back to sections</Link>
      </div>
    );
  }

  if (!user || !isStaff) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-zinc-400">Only permitted staff can post in this section.</p>
        <Link href={`/sections/${sectionId}`} className="text-accent hover:underline">
          Back to {section.companyName}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/sections/${sectionId}`}
        className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <FiArrowLeft size={16} />
        Back to {section.companyName}
      </Link>

      <div className="rounded-2xl border border-card-border bg-card-bg p-6 sm:p-8">
        <h1 className="mb-1 text-2xl font-black text-white">New Post</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Posting in <strong className="text-accent">{section.companyName}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's this about?"
              className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
              maxLength={200}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you know..."
              rows={8}
              className="w-full resize-none rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm leading-relaxed text-white placeholder-zinc-500 outline-none focus:border-accent"
            />
          </div>

          {/* Anonymous toggle */}
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
              isAnonymous
                ? "border-accent bg-accent/10 text-accent"
                : "border-card-border bg-input-bg text-zinc-400 hover:border-zinc-600"
            }`}
          >
            <FiEyeOff size={18} />
            <div className="text-left">
              <p className="text-sm font-medium">Post Anonymously</p>
              <p className="text-xs opacity-70">
                {isAnonymous
                  ? "Your identity will be hidden from readers"
                  : "Your name will be shown on this post"}
              </p>
            </div>
          </button>

          {error && (
            <p className="rounded-lg bg-negative/10 px-4 py-2 text-sm text-negative">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Post"}
          </button>
        </form>
      </div>
    </div>
  );
}
