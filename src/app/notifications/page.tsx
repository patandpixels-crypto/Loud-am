"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Notification } from "@/lib/types";
import Link from "next/link";
import {
  FiBell, FiArrowUp, FiMessageCircle, FiDollarSign,
  FiCheckCircle, FiCheck,
} from "react-icons/fi";

const ICON_MAP = {
  vote: FiArrowUp,
  reply: FiMessageCircle,
  earning: FiDollarSign,
  report_resolved: FiCheckCircle,
};

const COLOR_MAP = {
  vote: "text-positive",
  reply: "text-accent-3",
  earning: "text-accent-2",
  report_resolved: "text-muted",
};

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

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const q = query(
          collection(db, "notifications"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
        notifs.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(notifs);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user, authLoading]);

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    for (const n of unread) {
      batch.update(doc(db, "notifications", n.id), { read: true });
    }
    await batch.commit();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = async (notifId: string) => {
    await updateDoc(doc(db, "notifications", notifId), { read: true });
    setNotifications((prev) => prev.map((n) => n.id === notifId ? { ...n, read: true } : n));
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-subtext">Sign in to view notifications.</p>
        <Link
          href="/login"
          className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiBell size={22} className="text-accent-2" />
          <h1 className="text-2xl font-black">
            <span className="gradient-text">Notifications</span>
          </h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-bounce flex items-center gap-1.5 rounded-full border border-card-border px-3 py-1.5 text-xs font-bold text-subtext hover:bg-surface hover:text-heading"
          >
            <FiCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border py-16 text-center">
          <FiBell size={32} className="mx-auto mb-3 text-muted" />
          <p className="font-bold text-subtext">No notifications yet</p>
          <p className="mt-1 text-sm text-muted">
            You&apos;ll get notified when people interact with your posts.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = ICON_MAP[notif.type] || FiBell;
            const color = COLOR_MAP[notif.type] || "text-subtext";

            const inner = (
              <div
                className={`card-glow flex items-start gap-3 rounded-xl border bg-card-bg p-4 transition-all ${
                  notif.read ? "border-card-border opacity-60" : "border-accent/20"
                }`}
              >
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                  notif.read ? "bg-surface" : "bg-accent/10"
                }`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${notif.read ? "text-subtext" : "text-heading"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted">{notif.message}</p>
                  <p className="mt-1 text-xs text-muted">{getTimeAgo(notif.createdAt)}</p>
                </div>
                {!notif.read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markOneRead(notif.id);
                    }}
                    className="mt-1 flex-shrink-0 rounded-full p-1 text-muted hover:bg-surface hover:text-subtext"
                    title="Mark as read"
                  >
                    <FiCheck size={14} />
                  </button>
                )}
              </div>
            );

            if (notif.link) {
              return (
                <Link key={notif.id} href={notif.link} onClick={() => !notif.read && markOneRead(notif.id)}>
                  {inner}
                </Link>
              );
            }

            return <div key={notif.id}>{inner}</div>;
          })}
        </div>
      )}
    </div>
  );
}
