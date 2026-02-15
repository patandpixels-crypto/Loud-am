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
  orderBy,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  // Manage staff modal
  const [showManageStaff, setShowManageStaff] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState("");

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
            const { updateDoc, arrayUnion } = await import("firebase/firestore");
            await updateDoc(doc(db, "companySections", sectionId), {
              staffIds: arrayUnion(user.uid),
            });
          }
        } else if (user) {
          // Check if user has paid
          const accessQuery = query(
            collection(db, "sectionAccess"),
            where("sectionId", "==", sectionId),
            where("userId", "==", user.uid)
          );
          const accessSnap = await getDocs(accessQuery);
          if (!accessSnap.empty) {
            setHasAccess(true);
          }
        }

        // Fetch posts
        const postsQuery = query(
          collection(db, "sectionPosts"),
          where("sectionId", "==", sectionId),
          orderBy("createdAt", "desc")
        );
        const postsSnap = await getDocs(postsQuery);
        setPosts(
          postsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as SectionPost[]
        );
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

  const handlePayment = async () => {
    if (!user) return;
    setPaying(true);

    try {
      // Simulated payment — in production, integrate Stripe here
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await addDoc(collection(db, "sectionAccess"), {
        sectionId,
        userId: user.uid,
        paidAt: Date.now(),
        amount: 3,
      });

      setHasAccess(true);
      setShowPaywall(false);
    } catch (err) {
      console.error("Payment error:", err);
    } finally {
      setPaying(false);
    }
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
        <Link href="/sections" className="text-accent hover:underline">
          Back to sections
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link href="/sections" className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <FiArrowLeft size={16} />
        All Sections
      </Link>

      {/* Section Header */}
      <div className="mb-8 rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
              <FiBriefcase className="text-accent" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{section.companyName}</h1>
              <p className="text-sm text-zinc-400">{section.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isStaff && (
              <Link
                href={`/sections/${sectionId}/post/new`}
                className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                <FiPlus size={16} />
                New Post
              </Link>
            )}
            {isCreator && (
              <button
                onClick={() => setShowManageStaff(true)}
                className="flex items-center gap-2 rounded-full border border-card-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                <FiUserPlus size={16} />
                Manage Staff
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
          <span className="flex items-center gap-1">
            <FiUsers size={14} />
            {section.staffIds.length} staff
          </span>
          <span>Created by {section.creatorName}</span>
          {isStaff && (
            <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-semibold text-positive">
              Staff
            </span>
          )}
          {!isStaff && hasAccess && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
              Paid Access
            </span>
          )}
        </div>
      </div>

      {/* Posts */}
      {!user ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <FiLock className="mb-3 text-zinc-500" size={32} />
          <p className="text-lg font-semibold text-zinc-400">Sign in to view posts</p>
          <Link href="/login" className="mt-3 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white">
            Sign In
          </Link>
        </div>
      ) : !hasAccess ? (
        /* Paywall */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-card-border bg-card-bg py-16">
          <FiLock className="mb-4 text-accent" size={40} />
          <h2 className="mb-2 text-xl font-bold text-white">Staff-Only Content</h2>
          <p className="mb-1 max-w-md text-center text-sm text-zinc-400">
            This section is managed by <strong className="text-white">{section.companyName}</strong> staff.
            Only permitted staff can post here.
          </p>
          <p className="mb-6 text-sm text-zinc-400">
            Pay <strong className="text-accent">$3</strong> to unlock read access & post replies (200 words max).
          </p>
          {showPaywall ? (
            <div className="w-full max-w-sm rounded-xl border border-card-border bg-input-bg p-6">
              <h3 className="mb-4 text-center text-lg font-bold text-white">Complete Payment</h3>
              <div className="mb-4 rounded-lg bg-zinc-800 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Access to {section.companyName}</span>
                  <span className="font-bold text-white">$3.00</span>
                </div>
              </div>
              {/* Simulated payment form */}
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
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-lg font-semibold text-zinc-400">No posts yet</p>
          {isStaff && (
            <Link
              href={`/sections/${sectionId}/post/new`}
              className="mt-3 flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
            >
              <FiPlus size={16} />
              Write the first post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/sections/${sectionId}/post/${post.id}`}>
              <div className="group rounded-2xl border border-card-border bg-card-bg p-5 transition-colors hover:border-zinc-600">
                <h3 className="mb-2 text-lg font-bold text-white group-hover:text-accent">
                  {post.title}
                </h3>
                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                  {post.content}
                </p>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <FiUser size={12} />
                    {post.isAnonymous ? "Anonymous" : post.authorName}
                  </span>
                  <span>{getTimeAgo(post.createdAt)}</span>
                  <span>{post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Manage Staff Modal */}
      {showManageStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Manage Staff</h2>
              <button onClick={() => setShowManageStaff(false)} className="text-zinc-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>

            {/* Current staff emails */}
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-zinc-300">Current Staff</p>
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {section.staffEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300">
                    <span>{email}</span>
                    {email === user?.email?.toLowerCase() && (
                      <span className="text-xs text-accent">You</span>
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
                className="flex-1 rounded-lg border border-card-border bg-input-bg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
              />
              <button
                onClick={handleAddStaff}
                disabled={addingStaff}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
              >
                {addingStaff ? "..." : "Add"}
              </button>
            </div>
            {staffError && (
              <p className="mt-2 text-xs text-negative">{staffError}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
