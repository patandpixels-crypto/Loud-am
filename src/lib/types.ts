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
