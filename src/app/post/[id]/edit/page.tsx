"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Post } from "@/lib/types";
import { FiArrowLeft, FiX, FiPlus, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetName, setTargetName] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [targetLinks, setTargetLinks] = useState<string[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", id));
        if (postDoc.exists()) {
          const data = { id: postDoc.id, ...postDoc.data() } as Post;
          setPost(data);
          setTitle(data.title);
          setContent(data.content);
          setTargetName(data.targetName);
          setTargetLinks(data.targetLinks);
        }
      } catch {
        setError("Failed to load post.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  if (!post || !user || user.uid !== post.authorId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-subtext">You can only edit your own posts.</p>
        <Link
          href="/"
          className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20"
        >
          Go Home
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await updateDoc(doc(db, "posts", id), {
        title: title.trim(),
        content: content.trim(),
        targetName: targetName.trim(),
        targetLinks,
        editedAt: Date.now(),
      });
      router.push(`/post/${id}`);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/post/${id}`}
        className="btn-bounce mb-6 inline-flex items-center gap-1.5 text-sm text-subtext hover:text-accent-3"
      >
        <FiArrowLeft size={16} />
        Back to post
      </Link>

      <h1 className="mb-6 text-2xl font-black">
        <span className="gradient-text">Edit Post</span>
      </h1>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-negative/10 px-4 py-3 text-sm font-medium text-negative">
            <FiAlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-bold">Target</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Name</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Links</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                  className="flex-1 rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                  placeholder="@handle or https://..."
                />
                <button type="button" onClick={addLink} className="btn-bounce rounded-xl border border-card-border px-3 text-subtext hover:border-accent-3 hover:text-accent-3">
                  <FiPlus size={20} />
                </button>
              </div>
              {targetLinks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {targetLinks.map((link, i) => (
                    <span key={i} className="flex items-center gap-1.5 rounded-full bg-accent-3/10 px-3 py-1 text-sm text-accent-3">
                      {link}
                      <button type="button" onClick={() => removeLink(i)} className="text-muted hover:text-negative">
                        <FiX size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-lg font-bold">Content</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                required
                maxLength={120}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-subtle">Your Experience</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px] w-full resize-y rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/post/${id}`}
            className="btn-bounce flex-1 rounded-xl border border-card-border py-3 text-center text-sm font-bold text-subtext hover:bg-surface"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="btn-bounce flex-1 rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
