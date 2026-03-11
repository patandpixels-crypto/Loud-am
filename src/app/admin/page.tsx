"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post, UserProfile, Report } from "@/lib/types";
import {
  FiShield, FiUser, FiMail, FiEyeOff, FiEye,
  FiFlag, FiTrash2, FiEyeOff as FiHide, FiCheck, FiX, FiAlertTriangle,
} from "react-icons/fi";
import Link from "next/link";

interface PostWithAuthor extends Post {
  authorEmail?: string;
  authorProfile?: UserProfile;
}

export default function AdminPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "reports">("posts");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!userProfile?.isAdmin) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch posts
        const postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        const postsSnapshot = await getDocs(postsQuery);

        const postsWithAuthors: PostWithAuthor[] = await Promise.all(
          postsSnapshot.docs.map(async (postDoc) => {
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

        // Fetch reports
        const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsData = reportsSnapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
        setReports(reportsData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading, userProfile]);

  const handleHidePost = async (postId: string) => {
    setActionLoading(postId);
    try {
      await updateDoc(doc(db, "posts", postId), { hidden: true });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, hidden: true } : p));
    } catch (err) {
      console.error("Error hiding post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhidePost = async (postId: string) => {
    setActionLoading(postId);
    try {
      await updateDoc(doc(db, "posts", postId), { hidden: false });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, hidden: false } : p));
    } catch (err) {
      console.error("Error unhiding post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Permanently delete this post? This cannot be undone.")) return;
    setActionLoading(postId);
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      // Also resolve any reports for this post
      const relatedReports = reports.filter((r) => r.postId === postId);
      for (const report of relatedReports) {
        await updateDoc(doc(db, "reports", report.id), { status: "reviewed" });
      }
      setReports((prev) => prev.map((r) => r.postId === postId ? { ...r, status: "reviewed" } : r));
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (reportId: string, status: "reviewed" | "dismissed") => {
    setActionLoading(reportId);
    try {
      await updateDoc(doc(db, "reports", reportId), { status });
      setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status } : r));
    } catch (err) {
      console.error("Error resolving report:", err);
    } finally {
      setActionLoading(null);
    }
  };

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
        <p className="text-xl font-bold text-subtext">Admin Access Required</p>
        <p className="text-sm text-muted">You don&apos;t have permission to view this page.</p>
        <Link
          href="/"
          className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20"
        >
          Go Home
        </Link>
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <FiShield size={24} className="text-accent-2" />
        <h1 className="text-2xl font-black">
          <span className="gradient-text">Admin Dashboard</span>
        </h1>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-subtext">Total Posts</p>
          <p className="text-3xl font-black">{posts.length}</p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-subtext">Anonymous</p>
          <p className="text-3xl font-black text-accent-2">
            {posts.filter((p) => p.isAnonymous).length}
          </p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-subtext">Hidden</p>
          <p className="text-3xl font-black text-accent">
            {posts.filter((p) => p.hidden).length}
          </p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4">
          <p className="text-sm text-subtext">Pending Reports</p>
          <p className="text-3xl font-black text-negative">
            {pendingReports.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex overflow-hidden rounded-xl border border-card-border">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "posts"
              ? "bg-gradient-to-r from-accent to-accent-2 text-white"
              : "text-subtext hover:text-heading"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "reports"
              ? "bg-gradient-to-r from-accent to-accent-2 text-white"
              : "text-subtext hover:text-heading"
          }`}
        >
          Reports {pendingReports.length > 0 && (
            <span className="ml-1 rounded-full bg-negative px-1.5 py-0.5 text-[10px] text-white">
              {pendingReports.length}
            </span>
          )}
        </button>
      </div>

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <div className="overflow-hidden rounded-2xl border border-card-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-card-border bg-card-bg">
                <tr>
                  <th className="px-4 py-3 font-bold text-subtle">Post</th>
                  <th className="px-4 py-3 font-bold text-subtle">About</th>
                  <th className="px-4 py-3 font-bold text-subtle">Author Identity</th>
                  <th className="px-4 py-3 font-bold text-subtle">Type</th>
                  <th className="px-4 py-3 font-bold text-subtle">Score</th>
                  <th className="px-4 py-3 font-bold text-subtle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {posts.map((post) => (
                  <tr key={post.id} className={`transition-colors hover:bg-card-bg/50 ${post.hidden ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.hidden && (
                          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold text-accent">HIDDEN</span>
                        )}
                        <Link
                          href={`/post/${post.id}`}
                          className="font-medium text-heading hover:text-accent"
                        >
                          {post.title.length > 40
                            ? post.title.substring(0, 40) + "..."
                            : post.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-subtext">{post.targetName}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          {post.isAnonymous ? (
                            <FiEyeOff size={14} className="text-accent-2" />
                          ) : (
                            <FiEye size={14} className="text-positive" />
                          )}
                          <span className="flex items-center gap-1 text-subtle">
                            <FiUser size={12} />
                            {post.authorProfile?.displayName || post.authorName}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-muted">
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
                          post.score > 0 ? "text-positive" : post.score < 0 ? "text-negative" : "text-subtext"
                        }`}
                      >
                        {post.score > 0 ? "+" : ""}{post.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {post.hidden ? (
                          <button
                            onClick={() => handleUnhidePost(post.id)}
                            disabled={actionLoading === post.id}
                            className="btn-bounce rounded-lg p-1.5 text-positive hover:bg-positive/10 disabled:opacity-50"
                            title="Unhide post"
                          >
                            <FiEye size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleHidePost(post.id)}
                            disabled={actionLoading === post.id}
                            className="btn-bounce rounded-lg p-1.5 text-accent-2 hover:bg-accent-2/10 disabled:opacity-50"
                            title="Hide post"
                          >
                            <FiHide size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={actionLoading === post.id}
                          className="btn-bounce rounded-lg p-1.5 text-negative hover:bg-negative/10 disabled:opacity-50"
                          title="Delete post"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-card-border py-16 text-center">
              <FiFlag size={32} className="mx-auto mb-3 text-muted" />
              <p className="font-bold text-subtext">No reports yet</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className={`card-glow rounded-xl border bg-card-bg p-4 ${
                  report.status === "pending" ? "border-accent/30" : "border-card-border opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        report.status === "pending"
                          ? "bg-accent/10 text-accent"
                          : report.status === "reviewed"
                          ? "bg-positive/10 text-positive"
                          : "bg-muted/10 text-muted"
                      }`}>
                        {report.status}
                      </span>
                      <span className="rounded-full bg-negative/10 px-2 py-0.5 text-xs font-bold text-negative">
                        {report.reason.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-heading">
                      <FiAlertTriangle size={12} className="mr-1 inline text-accent" />
                      Post: &quot;{report.postTitle}&quot;
                    </p>
                    {report.details && (
                      <p className="mt-1 text-xs text-subtext">{report.details}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {report.status === "pending" && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          handleHidePost(report.postId);
                          handleResolveReport(report.id, "reviewed");
                        }}
                        disabled={actionLoading === report.id}
                        className="btn-bounce rounded-lg border border-accent-2/30 p-1.5 text-accent-2 hover:bg-accent-2/10 disabled:opacity-50"
                        title="Hide post & resolve"
                      >
                        <FiHide size={14} />
                      </button>
                      <button
                        onClick={() => {
                          handleDeletePost(report.postId);
                          handleResolveReport(report.id, "reviewed");
                        }}
                        disabled={actionLoading === report.id}
                        className="btn-bounce rounded-lg border border-negative/30 p-1.5 text-negative hover:bg-negative/10 disabled:opacity-50"
                        title="Delete post & resolve"
                      >
                        <FiTrash2 size={14} />
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, "dismissed")}
                        disabled={actionLoading === report.id}
                        className="btn-bounce rounded-lg border border-card-border p-1.5 text-muted hover:bg-surface hover:text-subtext disabled:opacity-50"
                        title="Dismiss report"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
