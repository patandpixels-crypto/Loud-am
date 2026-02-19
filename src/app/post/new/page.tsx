"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FiX, FiPlus, FiEye, FiEyeOff } from "react-icons/fi";
import Link from "next/link";

export default function NewPostPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetName, setTargetName] = useState("");
  const [targetType, setTargetType] = useState<"person" | "brand">("person");
  const [sentiment, setSentiment] = useState<"positive" | "negative">("positive");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [targetLinks, setTargetLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-subtext">You need to sign in to create a post.</p>
        <Link
          href="/login"
          className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const addLink = () => {
    const trimmed = linkInput.trim();
    if (trimmed && !targetLinks.includes(trimmed)) {
      setTargetLinks([...targetLinks, trimmed]);
      setLinkInput("");
    }
  };

  const removeLink = (index: number) => {
    setTargetLinks(targetLinks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        content: content.trim(),
        targetName: targetName.trim(),
        targetType,
        targetLinks,
        sentiment,
        authorId: user.uid,
        authorName: userProfile?.codeName || "Unknown",
        isAnonymous,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        createdAt: Date.now(),
      });
      router.push("/");
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-black">
        <span className="gradient-text">Create a Post</span>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-negative/10 px-4 py-3 text-sm font-medium text-negative">
            {error}
          </div>
        )}

        {/* Target Info */}
        <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-bold">Who is this about?</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Name
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                placeholder="Person or brand name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType("person")}
                  className={`btn-bounce flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                    targetType === "person"
                      ? "border-accent bg-accent/10 text-accent shadow-sm shadow-accent/10"
                      : "border-card-border text-subtext hover:border-zinc-500"
                  }`}
                >
                  Person
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("brand")}
                  className={`btn-bounce flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                    targetType === "brand"
                      ? "border-accent-3 bg-accent-3/10 text-accent-3 shadow-sm shadow-accent-3/10"
                      : "border-card-border text-subtext hover:border-zinc-500"
                  }`}
                >
                  Brand
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Links / Social Media Handles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                  className="flex-1 rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                  placeholder="@handle or https://..."
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="btn-bounce rounded-xl border border-card-border px-3 text-subtext transition-all hover:border-accent-3 hover:text-accent-3"
                >
                  <FiPlus size={20} />
                </button>
              </div>
              {targetLinks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetLinks.map((link, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full bg-accent-3/10 px-3 py-1 text-sm text-accent-3"
                    >
                      {link}
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="text-muted hover:text-negative"
                      >
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-bold">Your Review</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Sentiment
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSentiment("positive")}
                  className={`btn-bounce flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                    sentiment === "positive"
                      ? "border-positive bg-positive/10 text-positive shadow-sm shadow-positive/10"
                      : "border-card-border text-subtext hover:border-zinc-500"
                  }`}
                >
                  Positive
                </button>
                <button
                  type="button"
                  onClick={() => setSentiment("negative")}
                  className={`btn-bounce flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                    sentiment === "negative"
                      ? "border-negative bg-negative/10 text-negative shadow-sm shadow-negative/10"
                      : "border-card-border text-subtext hover:border-zinc-500"
                  }`}
                >
                  Negative
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                placeholder="Sum it up in a few words"
                required
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">
                Your Experience
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] w-full resize-y rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                placeholder="Tell your story. Be specific about what happened..."
                required
              />
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-bold">Privacy</h2>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
              isAnonymous
                ? "border-accent-2 bg-accent-2/10 shadow-sm shadow-accent-2/10"
                : "border-card-border hover:border-zinc-500"
            }`}
          >
            {isAnonymous ? (
              <FiEyeOff size={20} className="text-accent-2" />
            ) : (
              <FiEye size={20} className="text-subtext" />
            )}
            <div>
              <p className="font-medium">
                {isAnonymous ? "Posting Anonymously" : "Posting as " + (user.displayName || "yourself")}
              </p>
              <p className="text-sm text-subtext">
                {isAnonymous
                  ? "Your identity will be hidden from other users. Only admins can see who you are."
                  : "Other users will see your display name on this post."}
              </p>
            </div>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-bounce w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-4 text-lg font-black text-white shadow-lg shadow-accent/20 disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Post"}
        </button>
      </form>
    </div>
  );
}
