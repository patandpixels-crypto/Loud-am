"use client";

import Link from "next/link";
import { CompanySection } from "@/lib/types";
import { FiUsers, FiFileText, FiClock, FiXCircle, FiArrowRight } from "react-icons/fi";

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

// Generate a consistent color from company name
function getCompanyColor(name: string): string {
  const colors = [
    "from-blue-500/20 to-cyan-500/20",
    "from-violet-500/20 to-purple-500/20",
    "from-emerald-500/20 to-teal-500/20",
    "from-amber-500/20 to-orange-500/20",
    "from-rose-500/20 to-pink-500/20",
    "from-indigo-500/20 to-blue-500/20",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getCompanyInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function SectionCard({ section }: { section: CompanySection }) {
  const colorClass = getCompanyColor(section.companyName);

  return (
    <Link href={`/sections/${section.id}`}>
      <div className="group rounded-2xl border border-card-border bg-card-bg transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5">
        {/* Header with icon */}
        <div className="p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colorClass}`}>
              <span className="text-lg font-black text-heading">{getCompanyInitial(section.companyName)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-heading transition-colors group-hover:text-accent sm:text-lg">
                {section.companyName}
              </h3>
              <p className="text-xs text-muted">{getTimeAgo(section.createdAt)}</p>
            </div>
            <FiArrowRight size={16} className="mt-1 shrink-0 text-muted opacity-0 transition-all group-hover:translate-x-1 group-hover:text-accent group-hover:opacity-100" />
          </div>

          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-subtext">
            {section.description}
          </p>

          {/* Status + Stats */}
          <div className="flex flex-wrap items-center gap-2">
            {section.status === "pending" && (
              <span className="flex items-center gap-1 rounded-lg bg-accent-2/10 px-2 py-1 text-[11px] font-bold text-accent-2">
                <FiClock size={10} />
                Pending
              </span>
            )}
            {section.status === "rejected" && (
              <span className="flex items-center gap-1 rounded-lg bg-negative/10 px-2 py-1 text-[11px] font-bold text-negative">
                <FiXCircle size={10} />
                Rejected
              </span>
            )}
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1">
                <FiUsers size={12} className="text-accent-3" />
                <span className="font-medium">{section.staffIds.length}</span> staff
              </span>
              <span className="flex items-center gap-1">
                <FiFileText size={12} className="text-accent" />
                <span className="font-medium">{section.postCount}</span> posts
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
