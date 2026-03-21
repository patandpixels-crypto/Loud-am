export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  codeName: string;
  isAdmin: boolean;
  referralCode: string;
  referredBy?: string; // referralCode of the user who referred them
  createdAt: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  targetName: string;
  targetType: "person" | "brand";
  targetLinks: string[];
  sentiment: "positive" | "negative";
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  upvotes: number;
  downvotes: number;
  score: number;
  createdAt: number;
  hidden?: boolean;
  editedAt?: number;
}

export interface Vote {
  id: string;
  postId: string;
  userId: string;
  voteType: "up" | "down";
}

// Company Sections
export interface CompanySection {
  id: string;
  companyName: string;
  description: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  companyDomain: string; // e.g. "acme.com" — extracted from creator's email
  staffIds: string[]; // UIDs of permitted staff
  staffEmails: string[]; // emails for display
  postCount: number;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  reviewedAt?: number;
  createdAt: number;
}

export interface SectionPost {
  id: string;
  sectionId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  replyCount: number;
  createdAt: number;
}

export interface SectionReply {
  id: string;
  postId: string;
  sectionId: string;
  content: string; // max 200 words
  authorId: string;
  authorName: string;
  isPaidUser: boolean; // true if non-staff who paid for access
  createdAt: number;
}

export interface SectionAccess {
  id: string;
  sectionId: string;
  userId: string;
  paidAt: number;
  amount: number; // payment amount in original currency
}

export interface Earning {
  id: string;
  userId: string;
  sectionId: string;
  sectionPostId: string;
  fromPaymentBy: string; // userId of the person who paid
  amount: number;
  type?: "section_revenue" | "referral_bonus";
  createdAt: number;
}

export interface Report {
  id: string;
  postId: string;
  postTitle: string;
  reporterId: string;
  reason: "spam" | "harassment" | "misinformation" | "hate_speech" | "other";
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: number;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: number;
  processedAt?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: "vote" | "reply" | "earning" | "report_resolved";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: number;
}
