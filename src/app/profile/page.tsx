"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Post, SectionPost, Earning, PayoutRequest } from "@/lib/types";
import PostCard from "@/components/PostCard";
import Link from "next/link";
import {
  FiUser, FiCalendar, FiPlus, FiBriefcase, FiDollarSign,
  FiArrowRight, FiX, FiCheck, FiClock, FiAlertCircle,
  FiShare2, FiCopy, FiGift,
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

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
  "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Globus Bank",
  "Guaranty Trust Bank (GTB)", "Heritage Bank", "Jaiz Bank", "Keystone Bank",
  "Kuda Bank", "Opay", "Palmpay", "Polaris Bank", "Providus Bank",
  "Stanbic IBTC Bank", "Standard Chartered Bank", "Sterling Bank",
  "SunTrust Bank", "Titan Trust Bank", "Union Bank of Nigeria",
  "United Bank for Africa (UBA)", "Unity Bank", "VFD Microfinance Bank",
  "Wema Bank", "Zenith Bank",
];

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [sectionPosts, setSectionPosts] = useState<SectionPost[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [referralCount, setReferralCount] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payout modal state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      // Fetch posts
      try {
        const postsQuery = query(collection(db, "posts"), where("authorId", "==", user.uid));
        const postsSnap = await getDocs(postsQuery);
        const fetchedPosts = postsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];
        fetchedPosts.sort((a, b) => b.createdAt - a.createdAt);
        setPosts(fetchedPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }

      // Fetch section posts
      try {
        const sectionQuery = query(collection(db, "sectionPosts"), where("authorId", "==", user.uid));
        const sectionSnap = await getDocs(sectionQuery);
        const fetchedSectionPosts = sectionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as SectionPost[];
        fetchedSectionPosts.sort((a, b) => b.createdAt - a.createdAt);
        setSectionPosts(fetchedSectionPosts);
      } catch (err) {
        console.error("Error fetching section posts:", err);
      }

      // Fetch earnings
      try {
        const earningsQuery = query(collection(db, "earnings"), where("userId", "==", user.uid));
        const earningsSnap = await getDocs(earningsQuery);
        const fetchedEarnings = earningsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Earning[];
        fetchedEarnings.sort((a, b) => b.createdAt - a.createdAt);
        setEarnings(fetchedEarnings);
      } catch (err) {
        console.error("Error fetching earnings:", err);
      }

      // Fetch referral count
      try {
        if (userProfile?.referralCode) {
          const referralQuery = query(collection(db, "users"), where("referredBy", "==", userProfile.referralCode));
          const referralSnap = await getDocs(referralQuery);
          setReferralCount(referralSnap.size);
        }
      } catch (err) {
        console.error("Error fetching referrals:", err);
      }

      // Fetch payouts
      try {
        const payoutsQuery = query(collection(db, "payoutRequests"), where("userId", "==", user.uid));
        const payoutsSnap = await getDocs(payoutsQuery);
        const fetchedPayouts = payoutsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PayoutRequest[];
        fetchedPayouts.sort((a, b) => b.createdAt - a.createdAt);
        setPayouts(fetchedPayouts);
      } catch (err) {
        console.error("Error fetching payouts:", err);
      }

      setLoading(false);
    };
    fetchUserData();
  }, [authLoading, user]);

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
        <p className="text-subtext">Sign in to view your profile.</p>
        <Link href="/login" className="btn-bounce rounded-full bg-gradient-to-r from-accent to-accent-2 px-6 py-2 font-bold text-white shadow-lg shadow-accent/20">
          Sign In
        </Link>
      </div>
    );
  }

  const totalPosts = posts.length + sectionPosts.length;
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidOut = payouts.filter((p) => p.status === "approved").reduce((sum, p) => sum + p.amount, 0);
  const pendingPayout = payouts.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  const availableBalance = totalEarnings - totalPaidOut - pendingPayout;

  const handlePayoutSubmit = async () => {
    setPayoutError("");
    const amount = parseFloat(payoutAmount);

    if (!amount || amount <= 0) { setPayoutError("Enter a valid amount."); return; }
    if (amount > availableBalance) { setPayoutError(`You can only withdraw up to $${availableBalance.toFixed(2)}.`); return; }
    if (amount < 1) { setPayoutError("Minimum withdrawal is $1.00."); return; }
    if (!bankName) { setPayoutError("Select your bank."); return; }
    if (!accountNumber.trim() || accountNumber.trim().length < 10) { setPayoutError("Enter a valid 10-digit account number."); return; }
    if (!accountName.trim()) { setPayoutError("Enter the account holder name."); return; }

    setPayoutSubmitting(true);
    try {
      const newPayout: Omit<PayoutRequest, "id"> = {
        userId: user.uid,
        userEmail: user.email || "",
        userName: userProfile?.codeName || user.displayName || "User",
        amount,
        bankName,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        status: "pending",
        createdAt: Date.now(),
      };
      const docRef = await addDoc(collection(db, "payoutRequests"), newPayout);
      setPayouts((prev) => [{ id: docRef.id, ...newPayout }, ...prev]);
      setPayoutSuccess(true);
      setPayoutAmount("");
      setBankName("");
      setAccountNumber("");
      setAccountName("");
      setTimeout(() => { setShowPayoutModal(false); setPayoutSuccess(false); }, 2500);
    } catch {
      setPayoutError("Failed to submit. Try again.");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Profile Card */}
      <div className="card-glow mb-6 rounded-2xl border border-card-border bg-card-bg p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-accent-2/20">
            <FiUser size={28} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{userProfile?.codeName || "User"}</h1>
            <p className="text-sm text-subtext">{user.displayName || "User"}</p>
            <p className="text-xs text-muted">{user.email}</p>
            {userProfile && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <FiCalendar size={12} />
                Joined {new Date(userProfile.createdAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Earnings + Payout Card */}
      <div className="card-glow mb-6 rounded-2xl border border-accent-2/30 bg-accent-2/5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-2/20">
              <FiDollarSign size={20} className="text-accent-2" />
            </div>
            <div>
              <p className="text-sm text-subtext">Available Balance</p>
              <p className="text-2xl font-black text-accent-2">${availableBalance.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">Total earned: ${totalEarnings.toFixed(2)}</p>
            {totalPaidOut > 0 && <p className="text-xs text-positive">Withdrawn: ${totalPaidOut.toFixed(2)}</p>}
            {pendingPayout > 0 && <p className="text-xs text-accent-2">Pending: ${pendingPayout.toFixed(2)}</p>}
          </div>
        </div>
        <button
          onClick={() => setShowPayoutModal(true)}
          disabled={availableBalance < 1}
          className="btn-bounce mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 disabled:opacity-40"
        >
          <FiDollarSign size={16} />
          Withdraw Funds
          <FiArrowRight size={14} />
        </button>
        {availableBalance < 1 && totalEarnings > 0 && (
          <p className="mt-2 text-center text-xs text-muted">Minimum withdrawal: $1.00</p>
        )}
      </div>

      {/* Referral Card */}
      {userProfile?.referralCode && (
        <div className="card-glow mb-6 rounded-2xl border border-accent-3/30 bg-accent-3/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <FiShare2 size={18} className="text-accent-3" />
            <h3 className="text-lg font-bold text-heading">Invite Friends, Earn Rewards</h3>
          </div>
          <p className="mb-4 text-sm text-subtext">
            Share your link. When someone signs up and makes their first purchase, you earn a <span className="font-bold text-accent-2">$0.50 bonus</span>.
          </p>

          <div className="mb-4 flex items-stretch gap-2">
            <div className="flex flex-1 items-center rounded-xl border border-card-border bg-input-bg px-4 py-2.5">
              <code className="truncate text-sm text-heading">
                {typeof window !== "undefined" ? `${window.location.origin}/login?ref=${userProfile.referralCode}` : `/login?ref=${userProfile.referralCode}`}
              </code>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/login?ref=${userProfile.referralCode}`;
                navigator.clipboard.writeText(url);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="btn-bounce flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-accent-2 px-4 text-sm font-bold text-white shadow-lg shadow-accent/20"
            >
              {copiedLink ? <FiCheck size={16} /> : <FiCopy size={16} />}
              {copiedLink ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-card-border bg-card-bg px-4 py-3">
            <div className="flex items-center gap-2">
              <FiGift size={14} className="text-accent-3" />
              <span className="text-sm text-subtext">Referrals:</span>
              <span className="text-sm font-bold text-heading">{referralCount}</span>
            </div>
            <div className="h-4 w-px bg-card-border" />
            <div className="flex items-center gap-2">
              <FiDollarSign size={14} className="text-accent-2" />
              <span className="text-sm text-subtext">Referral earnings:</span>
              <span className="text-sm font-bold text-accent-2">
                ${earnings.filter((e) => e.type === "referral_bonus").reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-bold">Withdrawal History</h2>
          <div className="space-y-2">
            {payouts.map((payout) => (
              <div key={payout.id} className="card-glow flex items-center justify-between rounded-xl border border-card-border bg-card-bg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    payout.status === "approved" ? "bg-positive/10" : payout.status === "rejected" ? "bg-negative/10" : "bg-accent-2/10"
                  }`}>
                    {payout.status === "approved" ? <FiCheck size={14} className="text-positive" /> :
                     payout.status === "rejected" ? <FiX size={14} className="text-negative" /> :
                     <FiClock size={14} className="text-accent-2" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">{payout.bankName} &middot; ****{payout.accountNumber.slice(-4)}</p>
                    <p className="text-xs text-muted">
                      {getTimeAgo(payout.createdAt)}
                      {payout.status === "rejected" && payout.adminNote && <span className="ml-1 text-negative"> &middot; {payout.adminNote}</span>}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${payout.status === "approved" ? "text-positive" : payout.status === "rejected" ? "text-negative" : "text-accent-2"}`}>
                    ${payout.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs font-bold ${payout.status === "approved" ? "text-positive" : payout.status === "rejected" ? "text-negative" : "text-accent-2"}`}>
                    {payout.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-black">{totalPosts}</p>
          <p className="text-xs text-subtext">Total Posts</p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-black text-positive">{posts.filter((p) => p.sentiment === "positive").length}</p>
          <p className="text-xs text-subtext">Positive</p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-black text-negative">{posts.filter((p) => p.sentiment === "negative").length}</p>
          <p className="text-xs text-subtext">Negative</p>
        </div>
        <div className="card-glow rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-2xl font-black text-accent-3">{sectionPosts.length}</p>
          <p className="text-xs text-subtext">Section</p>
        </div>
      </div>

      {/* Earnings History */}
      {earnings.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-bold">Earnings History</h2>
          <div className="space-y-2">
            {earnings.slice(0, 10).map((earning) => (
              <div key={earning.id} className="card-glow flex items-center justify-between rounded-xl border border-card-border bg-card-bg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-2/10">
                    <FiDollarSign size={14} className="text-accent-2" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">Section post earning</p>
                    <p className="text-xs text-muted">{getTimeAgo(earning.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-accent-2">+${earning.amount.toFixed(2)}</p>
              </div>
            ))}
            {earnings.length > 10 && <p className="text-center text-xs text-muted">and {earnings.length - 10} more...</p>}
          </div>
        </div>
      )}

      {/* User's Posts */}
      <h2 className="mb-4 text-lg font-bold">Your Posts</h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-2/30 border-t-accent" />
        </div>
      ) : posts.length === 0 && sectionPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-card-border bg-card-bg py-12 text-center">
          <p className="mb-2 text-subtle">You haven&apos;t posted anything yet.</p>
          <Link href="/post/new" className="btn-bounce mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 px-5 py-2.5 font-bold text-white shadow-lg shadow-accent/20">
            <FiPlus size={16} />
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
          ))}
          {sectionPosts.length > 0 && (
            <>
              {posts.length > 0 && (
                <div className="flex items-center gap-2 pt-4">
                  <FiBriefcase size={16} className="text-accent-2" />
                  <h3 className="text-sm font-semibold text-subtext">Section Posts</h3>
                </div>
              )}
              {sectionPosts.map((sp) => (
                <Link key={sp.id} href={`/sections/${sp.sectionId}/post/${sp.id}`} className="block">
                  <div className="card-glow group rounded-2xl border border-card-border bg-card-bg p-5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full bg-accent-2/10 px-2 py-0.5 text-xs font-bold text-accent-2">Section</span>
                    </div>
                    <h3 className="mb-1 text-lg font-bold leading-snug text-heading group-hover:text-accent">{sp.title}</h3>
                    <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-subtext">{sp.content}</p>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <FiUser size={12} />
                      <span>{sp.isAnonymous ? "Anonymous" : sp.authorName}</span>
                      <span className="text-accent-2">&middot;</span>
                      <span>{getTimeAgo(sp.createdAt)}</span>
                      <span className="text-accent-2">&middot;</span>
                      <span>{sp.replyCount} {sp.replyCount === 1 ? "reply" : "replies"}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4" onClick={() => !payoutSubmitting && setShowPayoutModal(false)}>
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card-bg p-6" onClick={(e) => e.stopPropagation()}>
            {payoutSuccess ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-positive/20">
                  <FiCheck size={24} className="text-positive" />
                </div>
                <p className="text-lg font-bold">Withdrawal requested!</p>
                <p className="mt-1 text-sm text-subtext">We&apos;ll process it within 24-48 hours.</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Withdraw Funds</h3>
                  <button onClick={() => setShowPayoutModal(false)} className="text-muted hover:text-heading"><FiX size={20} /></button>
                </div>
                <div className="mb-5 rounded-xl border border-accent-2/20 bg-accent-2/5 px-4 py-3 text-center">
                  <p className="text-xs text-subtext">Available</p>
                  <p className="text-xl font-black text-accent-2">${availableBalance.toFixed(2)}</p>
                </div>
                {payoutError && (
                  <div className="mb-4 flex items-center gap-2 rounded-xl bg-negative/10 px-4 py-2.5 text-sm text-negative">
                    <FiAlertCircle size={14} />{payoutError}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-subtle">Amount (USD)</label>
                    <input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                      placeholder="0.00" min="1" max={availableBalance} step="0.01" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-subtle">Bank</label>
                    <select value={bankName} onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10">
                      <option value="">Select bank...</option>
                      {NIGERIAN_BANKS.map((bank) => <option key={bank} value={bank}>{bank}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-subtle">Account Number</label>
                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                      placeholder="0123456789" maxLength={10} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-subtle">Account Name</label>
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)}
                      className="w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-heading placeholder-muted outline-none transition-all focus:border-accent focus:shadow-lg focus:shadow-accent/10"
                      placeholder="John Doe" />
                  </div>
                  <button onClick={handlePayoutSubmit} disabled={payoutSubmitting}
                    className="btn-bounce w-full rounded-xl bg-gradient-to-r from-accent to-accent-2 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 disabled:opacity-50">
                    {payoutSubmitting ? "Submitting..." : "Request Withdrawal"}
                  </button>
                  <p className="text-center text-xs text-muted">Withdrawals are processed manually within 24-48 hours.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
