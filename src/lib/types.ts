export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
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
  staffIds: string[]; // UIDs of permitted staff
  staffEmails: string[]; // emails for display
  postCount: number;
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
  isPaidUser: boolean; // true if non-staff who paid $3
  createdAt: number;
}

export interface SectionAccess {
  id: string;
  sectionId: string;
  userId: string;
  paidAt: number;
  amount: number; // $3
}

export interface Earning {
  id: string;
  userId: string;
  sectionId: string;
  sectionPostId: string;
  fromPaymentBy: string; // userId of the person who paid
  amount: number;
  createdAt: number;
}
