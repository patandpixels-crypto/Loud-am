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
        <p className="text-zinc-400">You need to sign in to create a post.</p>
        <Link
          href="/login"
          className="rounded-full bg-accent px-6 py-2 font-semibold text-white hover:bg-accent-hover"
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
        authorName: user.displayName || userProfile?.displayName || "Unknown",
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
      <h1 className="mb-6 text-2xl font-bold">Create a Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Target Info */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-semibold">Who is this about?</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Name
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-input-bg px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-accent"
                placeholder="Person or brand name"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType("person")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    targetType === "person"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-card-border text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  Person
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType("brand")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    targetType === "brand"
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-card-border text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  Brand
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
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
                  className="flex-1 rounded-lg border border-card-border bg-input-bg px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-accent"
                  placeholder="@handle or https://..."
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="rounded-lg border border-card-border px-3 text-zinc-400 transition-colors hover:border-accent hover:text-accent"
                >
                  <FiPlus size={20} />
                </button>
              </div>
              {targetLinks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetLinks.map((link, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 rounded-full bg-input-bg px-3 py-1 text-sm text-zinc-300"
                    >
                      {link}
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="text-zinc-500 hover:text-red-400"
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
        <div className="rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-semibold">Your Review</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Sentiment
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSentiment("positive")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    sentiment === "positive"
                      ? "border-positive bg-positive/10 text-positive"
                      : "border-card-border text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  Positive
                </button>
                <button
                  type="button"
                  onClick={() => setSentiment("negative")}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    sentiment === "negative"
                      ? "border-negative bg-negative/10 text-negative"
                      : "border-card-border text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  Negative
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-input-bg px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-accent"
                placeholder="Sum it up in a few words"
                required
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-300">
                Your Experience
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] w-full resize-y rounded-lg border border-card-border bg-input-bg px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-accent"
                placeholder="Tell your story. Be specific about what happened..."
                required
              />
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-semibold">Privacy</h2>
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
              isAnonymous
                ? "border-accent bg-accent/10"
                : "border-card-border hover:border-zinc-500"
            }`}
          >
            {isAnonymous ? (
              <FiEyeOff size={20} className="text-accent" />
            ) : (
              <FiEye size={20} className="text-zinc-400" />
            )}
            <div>
              <p className="font-medium">
                {isAnonymous ? "Posting Anonymously" : "Posting as " + (user.displayName || "yourself")}
              </p>
              <p className="text-sm text-zinc-400">
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
          className="w-full rounded-xl bg-accent py-4 text-lg font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish Post"}
        </button>
      </form>
    </div>
  );
}
