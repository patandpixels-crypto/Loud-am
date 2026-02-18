"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { FiArrowLeft, FiBriefcase, FiPlus, FiX } from "react-icons/fi";
import Link from "next/link";

export default function CreateSectionPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffEmails, setStaffEmails] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addStaffEmail = () => {
    const email = staffEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email address");
      return;
    }
    if (staffEmails.includes(email)) {
      setError("Email already added");
      return;
    }
    if (email === user?.email?.toLowerCase()) {
      setError("You are automatically added as staff");
      return;
    }
    setStaffEmails([...staffEmails, email]);
    setStaffEmail("");
    setError("");
  };

  const removeStaffEmail = (email: string) => {
    setStaffEmails(staffEmails.filter((e) => e !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const docRef = await addDoc(collection(db, "companySections"), {
        companyName: companyName.trim(),
        description: description.trim(),
        creatorId: user.uid,
        creatorName: userProfile.codeName || userProfile.displayName,
        staffIds: [user.uid],
        staffEmails: [user.email?.toLowerCase(), ...staffEmails],
        postCount: 0,
        createdAt: Date.now(),
      });

      router.push(`/sections/${docRef.id}`);
    } catch (err) {
      console.error("Error creating section:", err);
      setError("Failed to create section. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-zinc-400">You must be signed in to create a section.</p>
        <Link href="/login" className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/sections" className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <FiArrowLeft size={16} />
        Back to Sections
      </Link>

      <div className="rounded-2xl border border-card-border bg-card-bg p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <FiBriefcase className="text-accent" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Create Company Section</h1>
            <p className="text-sm text-zinc-400">Set up a private space for your company</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this section about?"
              rows={3}
              className="w-full resize-none rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
              maxLength={500}
            />
          </div>

          {/* Invite Staff */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Invite Staff Members (by email)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStaffEmail(); } }}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={addStaffEmail}
                className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                <FiPlus size={16} />
              </button>
            </div>
            {staffEmails.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {staffEmails.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs text-accent"
                  >
                    {email}
                    <button type="button" onClick={() => removeStaffEmail(email)} className="hover:text-white">
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              You are automatically added as staff. Invited staff can post when they sign up with these emails.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-negative/10 px-4 py-2 text-sm text-negative">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Section"}
          </button>
        </form>
      </div>
    </div>
  );
}
