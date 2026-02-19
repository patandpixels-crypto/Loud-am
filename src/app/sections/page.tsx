"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { CompanySection } from "@/lib/types";
import SectionCard from "@/components/SectionCard";
import { FiPlus, FiSearch } from "react-icons/fi";

export default function SectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sections, setSections] = useState<CompanySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const q = query(collection(db, "companySections"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CompanySection[];
        setSections(data);
      } catch (err) {
        console.error("Error fetching sections:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  const filtered = sections.filter((s) =>
    s.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">
            Company <span className="gradient-text">Sections</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Insider company talk. Staff-only posting. Pay $3 to read & reply.
          </p>
        </div>
        {user && (
          <Link
            href="/sections/create"
            className="btn-bounce flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20"
          >
            <FiPlus size={16} />
            Create Section
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input
          type="text"
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-card-border bg-input-bg py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-16">
          <p className="text-lg font-bold text-zinc-400">No company sections yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            {user ? "Be the first to create one!" : "Sign in to create a company section."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
