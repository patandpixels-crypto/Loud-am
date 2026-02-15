"use client";

import Link from "next/link";
import { CompanySection } from "@/lib/types";
import { FiBriefcase, FiUsers, FiFileText } from "react-icons/fi";

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

export default function SectionCard({ section }: { section: CompanySection }) {
  return (
    <Link href={`/sections/${section.id}`}>
      <div className="group rounded-2xl border border-card-border bg-card-bg p-5 transition-colors hover:border-zinc-600">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
            <FiBriefcase className="text-accent" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-white group-hover:text-accent">
              {section.companyName}
            </h3>
            <p className="text-xs text-zinc-500">Created {getTimeAgo(section.createdAt)}</p>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {section.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <FiUsers size={12} />
            {section.staffIds.length} staff
          </span>
          <span className="flex items-center gap-1">
            <FiFileText size={12} />
            {section.postCount} posts
          </span>
        </div>
      </div>
    </Link>
  );
}
