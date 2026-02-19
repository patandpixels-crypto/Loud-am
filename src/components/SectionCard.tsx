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
      <div className="card-glow group rounded-2xl border border-card-border bg-card-bg p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent-2/20">
            <FiBriefcase className="text-accent-2" size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-heading transition-colors group-hover:text-accent-2">
              {section.companyName}
            </h3>
            <p className="text-xs text-muted">Created {getTimeAgo(section.createdAt)}</p>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-subtext">
          {section.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1 text-accent-3">
            <FiUsers size={12} />
            {section.staffIds.length} staff
          </span>
          <span className="flex items-center gap-1 text-accent">
            <FiFileText size={12} />
            {section.postCount} posts
          </span>
        </div>
      </div>
    </Link>
  );
}
