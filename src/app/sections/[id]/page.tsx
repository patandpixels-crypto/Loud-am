"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { openPaystack, grantAccessServerSide } from "@/lib/paystack";
import { CompanySection, SectionPost, SectionAccess } from "@/lib/types";
import {
  FiArrowLeft,
  FiBriefcase,
  FiPlus,
  FiLock,
  FiUsers,
  FiUser,
  FiDollarSign,
  FiUserPlus,
  FiX,
  FiClock,
  FiAlertTriangle,
  FiTrash2,
} from "react-icons/fi";

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

export default function SectionDetailPage() {
  const params = useParams();
  const sectionId = params.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  const [section, setSection] = useState<CompanySection | null>(null);
  const [posts, setPosts] = useState<SectionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [paying, setPaying] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Manage staff modal
  const [showManageStaff, setShowManageStaff] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, "sectionPosts"),
        where("sectionId", "==", sectionId)
      );
      const postsSnap = await getDocs(postsQuery);
      const fetched = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as SectionPost[];
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(fetched);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    const fetchSection = async () => {
      try {
        const docSnap = await getDoc(doc(db, "companySections", sectionId));
        if (!docSnap.exists()) {
          setLoading(false);
          return;
        }

        const sectionData = { id: docSnap.id, ...docSnap.data() } as CompanySection;
        setSection(sectionData);

        const creator = user?.uid === sectionData.creatorId;
        setIsCreator(creator);

        // Check if user is staff
        const staff =
          user &&
          (sectionData.staffIds.includes(user.uid) ||
            sectionData.staffEmails.includes(user.email?.toLowerCase() || ""));
        setIsStaff(!!staff);

        if (staff) {
          setHasAccess(true);
          // If staff by email but not by ID, update staffIds
          if (user && !sectionData.staffIds.includes(user.uid)) {
            try {
              const { updateDoc, arrayUnion } = await import("firebase/firestore");
              await updateDoc(doc(db, "companySections", sectionId), {
                staffIds: arrayUnion(user.uid),
              });
            } catch (err) {
              console.error("Error updating staffIds:", err);
            }
          }
        } else if (user) {
          // Check if user has paid
          try {
            const accessQuery = query(
              collection(db, "sectionAccess"),
              where("userId", "==", user.uid)
            );
            const accessSnap = await getDocs(accessQuery);
            const hasPaid = accessSnap.docs.some((d) => d.data().sectionId === sectionId);
            if (hasPaid) {
              setHasAccess(true);
            }
          } catch (err) {
            console.error("Error checking access:", err);
          }
        }

        // Fetch posts separately so access-check failures don't block it
        await fetchPosts();
      } catch (err) {
        console.error("Error fetching section:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchSection();
    }
  }, [sectionId, user, authLoading]);

  const grantAccess = async (reference: string) => {
    if (!user) return;
    setPaying(true);

    try {
      // Get Firebase ID token for server-side authentication
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.error("Could not get auth token");
        setPaying(false);
        return;
      }

      // Call secure server-side endpoint that verifies payment, grants access, and distributes earnings
      const result = await grantAccessServerSide(reference, sectionId, idToken);
      if (!result.success) {
        console.error("Grant access failed:", result.error);
        setPaying(false);
        return;
      }

      setHasAccess(true);
      await fetchPosts();
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setPaying(false);
    }
  };

  const handlePayment = (currency: "NGN" | "USD") => {
    if (!user?.email) return;
    const amount = currency === "NGN" ? 300 * 100 : 3 * 100; // 300 NGN in kobo or $3 in cents
    openPaystack({
      email: user.email,
      amountInCents: amount,
      currency,
      metadata: { sectionId, userId: user.uid },
      onSuccess: (reference) => {
        grantAccess(reference);
      },
      onClose: () => {},
    });
  };

  const handleAddStaff = async () => {
    const email = newStaffEmail.trim().toLowerCase();
    if (!email || !section) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStaffError("Invalid email address");
      return;
    }
    if (section.staffEmails.includes(email)) {
      setStaffError("Already a staff member");
      return;
    }
    // Enforce same company domain
    if (section.companyDomain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain !== section.companyDomain) {
        setStaffError(`Only @${section.companyDomain} emails can be added`);
        return;
      }
    }

    setAddingStaff(true);
    setStaffError("");

    try {
      const { updateDoc, arrayUnion } = await import("firebase/firestore");
      await updateDoc(doc(db, "companySections", sectionId), {
        staffEmails: arrayUnion(email),
      });
      setSection({
        ...section,
        staffEmails: [...section.staffEmails, email],
      });
      setNewStaffEmail("");
    } catch (err) {
      console.error("Error adding staff:", err);
      setStaffError("Failed to add staff member");
    } finally {
      setAddingStaff(false);
    }
  };

  const isAdmin = !!userProfile?.isAdmin;

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

    setDeletingPostId(postId);
    try {
      // Delete all replies for this post
      const repliesQuery = query(
        collection(db, "sectionReplies"),
        where("postId", "==", postId)
      );
      const repliesSnap = await getDocs(repliesQuery);
      await Promise.all(repliesSnap.docs.map((d) => deleteDoc(d.ref)));

      // Delete the post
      await deleteDoc(doc(db, "sectionPosts", postId));
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    } finally {
      setDeletingPostId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-subtext">Section not found</p>
        <Link href="/sections" className="text-accent-3 hover:underline">
          Back to sections
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/sections" className="btn-bounce mb-6 flex items-center gap-2 text-sm text-subtext hover:text-accent-3">
        <FiArrowLeft size={16} />
        All Sections
      </Link>

      {/* Section Header */}
      <div className="card-glow mb-8 rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/20">
              <FiBriefcase className="text-accent-2" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-heading">{section.companyName}</h1>
              <p className="text-sm text-subtext">{section.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isStaff && (
              <Link
                href={`/sections/${sectionId}/post/new`}
                className="btn-bounce flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20"
              >
                <FiPlus size={16} />
                New Post
              </Link>
            )}
            {isCreator && (
              <button
                onClick={() => setShowManageStaff(true)}
                className="btn-bounce flex items-center gap-2 rounded-full border border-card-border px-4 py-2.5 text-sm font-medium text-subtle transition-colors hover:bg-surface"
              >
                <FiUserPlus size={16} />
                Manage Staff
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted">
          <span className="flex items-center gap-1 text-accent-3">
            <FiUsers size={14} />
            {section.staffIds.length} staff
          </span>
          <span>Created by {section.creatorName}</span>
          {isStaff && (
            <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-bold text-positive">
              Staff
            </span>
          )}
          {!isStaff && hasAccess && (
            <span className="rounded-full bg-accent-2/10 px-2 py-0.5 text-xs font-bold text-accent-2">
              Paid Access
            </span>
          )}
        </div>
      </div>

      {/* Pending / Rejected status banner */}
      {section.status === "pending" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-2/30 bg-accent-2/5 px-4 py-3">
          <FiClock className="mt-0.5 shrink-0 text-accent-2" size={18} />
          <div>
            <p className="text-sm font-bold text-heading">Pending Admin Approval</p>
            <p className="text-xs text-subtext">
              This section is awaiting review by an admin. It is only visible to you until approved.
            </p>
          </div>
        </div>
      )}
      {section.status === "rejected" && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-negative/30 bg-negative/5 px-4 py-3">
          <FiAlertTriangle className="mt-0.5 shrink-0 text-negative" size={18} />
          <div>
            <p className="text-sm font-bold text-heading">Section Rejected</p>
            <p className="text-xs text-subtext">
              This section was not approved.{section.adminNote && <> Reason: {section.adminNote}</>}
            </p>
          </div>
        </div>
      )}

      {/* Posts */}
      {!user ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <FiLock className="mb-3 text-muted" size={32} />
          <p className="text-lg font-bold text-subtext">Sign in to view posts</p>
          <Link href="/login" className="btn-bounce mt-3 rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20">
            Sign In
          </Link>
        </div>
      ) : !hasAccess ? (
        /* Paywall */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-card-border bg-card-bg py-16">
          <FiLock className="mb-4 text-accent-2" size={40} />
          <h2 className="mb-2 text-xl font-black text-heading">Staff-Only Content</h2>
          <p className="mb-1 max-w-md text-center text-sm text-subtext">
            This section is managed by <strong className="text-heading">{section.companyName}</strong> staff.
            Only permitted staff can post here.
          </p>
          <p className="mb-6 text-sm text-subtext">
            Unlock read access & post replies (200 words max).
          </p>
          {paying ? (
            <div className="flex items-center gap-2 text-sm text-subtext">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Verifying payment...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <button
                onClick={() => handlePayment("NGN")}
                className="btn-bounce flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-3 text-sm font-black text-white shadow-lg shadow-accent/20"
              >
                <FiDollarSign size={16} />
                Pay &#8358;300 (NGN)
              </button>
              <button
                onClick={() => handlePayment("USD")}
                className="btn-bounce flex items-center gap-2 rounded-full border-2 border-accent px-6 py-3 text-sm font-bold text-accent transition-colors hover:bg-accent hover:text-white"
              >
                <FiDollarSign size={16} />
                Pay $3 (USD)
              </button>
            </div>
          )}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-lg font-bold text-subtext">No posts yet</p>
          {isStaff && (
            <Link
              href={`/sections/${sectionId}/post/new`}
              className="btn-bounce mt-3 flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20"
            >
              <FiPlus size={16} />
              Write the first post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="relative">
              <Link href={`/sections/${sectionId}/post/${post.id}`} className="block">
                <div className="card-glow group rounded-2xl border border-card-border bg-card-bg p-5">
                  <h3 className="mb-2 text-lg font-bold text-heading group-hover:text-accent">
                    {post.title}
                  </h3>
                  <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-subtext">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <FiUser size={12} />
                      {post.isAnonymous ? "Anonymous" : post.authorName}
                    </span>
                    <span className="text-accent-2">{getTimeAgo(post.createdAt)}</span>
                    <span>{post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}</span>
                  </div>
                </div>
              </Link>
              {(isAdmin || post.authorId === user?.uid) && (
                <button
                  onClick={(e) => handleDeletePost(e, post.id)}
                  disabled={deletingPostId === post.id}
                  className="absolute right-3 top-3 rounded-lg p-2 text-muted transition-colors hover:bg-negative/10 hover:text-negative disabled:opacity-50"
                  title="Delete post"
                >
                  {deletingPostId === post.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-negative border-t-transparent" />
                  ) : (
                    <FiTrash2 size={16} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manage Staff Modal */}
      {showManageStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-heading">Manage Staff</h2>
              <button onClick={() => setShowManageStaff(false)} className="text-subtext hover:text-heading">
                <FiX size={20} />
              </button>
            </div>

            {/* Current staff emails */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-subtle">Current Staff</p>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {section.staffEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm text-subtle">
                    <span>{email}</span>
                    {email === user?.email?.toLowerCase() && (
                      <span className="text-xs font-bold text-accent-2">You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add new staff */}
            <div className="flex gap-2">
              <input
                type="email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddStaff(); } }}
                placeholder="Add staff email..."
                className="flex-1 rounded-xl border border-card-border bg-input-bg px-3 py-2 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent"
              />
              <button
                onClick={handleAddStaff}
                disabled={addingStaff}
                className="btn-bounce rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {addingStaff ? "..." : "Add"}
              </button>
            </div>
            {staffError && (
              <p className="mt-2 text-xs font-medium text-negative">{staffError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
