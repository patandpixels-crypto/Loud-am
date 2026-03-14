"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getEmailDomain, isGenericDomain, emailMatchesDomain } from "@/lib/emailDomain";
import { FiArrowLeft, FiBriefcase, FiPlus, FiX, FiAlertTriangle, FiClock } from "react-icons/fi";
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

  const userDomain = user?.email ? getEmailDomain(user.email) : null;
  const isBlockedDomain = userDomain ? isGenericDomain(userDomain) : false;

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
    if (userDomain && !emailMatchesDomain(email, userDomain)) {
      setError(`Staff emails must use the @${userDomain} domain`);
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
    if (!user || !userProfile || !userDomain) return;

    if (isBlockedDomain) {
      setError("You must use a company email to create a section.");
      return;
    }

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
        creatorEmail: user.email?.toLowerCase(),
        companyDomain: userDomain,
        staffIds: [user.uid],
        staffEmails: [user.email?.toLowerCase(), ...staffEmails],
        postCount: 0,
        status: "pending",
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-subtext">You must be signed in to create a section.</p>
        <Link href="/login" className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-accent/20">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/sections" className="btn-bounce mb-6 flex items-center gap-2 text-sm text-subtext hover:text-accent-3">
        <FiArrowLeft size={16} />
        Back to Sections
      </Link>

      <div className="card-glow rounded-2xl border border-card-border bg-card-bg p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/20">
            <FiBriefcase className="text-accent-2" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black">
              <span className="gradient-text">Create Company Section</span>
            </h1>
            <p className="text-sm text-subtext">Set up a private space for your company</p>
          </div>
        </div>

        {/* Blocked domain warning */}
        {isBlockedDomain && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-accent" size={18} />
            <div>
              <p className="text-sm font-bold text-heading">Company email required</p>
              <p className="mt-0.5 text-xs text-subtext">
                You&apos;re signed in with <strong className="text-subtle">{user.email}</strong> which is a personal email.
                To create a company section, sign in with your work email (e.g. you@company.com).
              </p>
            </div>
          </div>
        )}

        {/* Approval notice */}
        {!isBlockedDomain && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent-2/30 bg-accent-2/5 px-4 py-3">
            <FiClock className="mt-0.5 shrink-0 text-accent-2" size={18} />
            <div>
              <p className="text-sm font-bold text-heading">Admin approval required</p>
              <p className="mt-0.5 text-xs text-subtext">
                Your section will be reviewed by an admin before it becomes publicly visible.
                {userDomain && <> Your company domain: <strong className="text-accent-2">@{userDomain}</strong></>}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              disabled={isBlockedDomain}
              className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10 disabled:opacity-50"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this section about?"
              rows={3}
              disabled={isBlockedDomain}
              className="w-full resize-none rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10 disabled:opacity-50"
              maxLength={500}
            />
          </div>

          {/* Invite Staff */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-subtle">
              Invite Staff Members (by email)
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStaffEmail(); } }}
                placeholder={userDomain ? `colleague@${userDomain}` : "colleague@company.com"}
                disabled={isBlockedDomain}
                className="flex-1 rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={addStaffEmail}
                disabled={isBlockedDomain}
                className="btn-bounce rounded-xl bg-surface px-4 py-3 text-sm font-medium text-heading transition-colors hover:bg-zinc-700 disabled:opacity-50"
              >
                <FiPlus size={16} />
              </button>
            </div>
            {staffEmails.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {staffEmails.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1.5 rounded-full bg-accent-2/10 px-3 py-1 text-xs font-medium text-accent-2"
                  >
                    {email}
                    <button type="button" onClick={() => removeStaffEmail(email)} className="hover:text-heading">
                      <FiX size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-muted">
              You are automatically added as staff.
              {userDomain && !isBlockedDomain && <> Only <strong>@{userDomain}</strong> emails can be added.</>}
            </p>
          </div>

          {error && (
            <p className="rounded-xl bg-negative/10 px-4 py-2 text-sm font-medium text-negative">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || isBlockedDomain}
            className="btn-bounce w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 text-sm font-black text-white shadow-lg shadow-accent/20 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Submit for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
