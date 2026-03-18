"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { UserProfile } from "./types";
import { generateCodeName } from "./codename";
import { generateReferralCode } from "./referral";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  emailVerified: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, referredBy?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setEmailVerified(user?.emailVerified ?? false);
      if (user) {
        const profileDoc = await getDoc(doc(db, "users", user.uid));
        if (profileDoc.exists()) {
          const profile = profileDoc.data() as UserProfile;
          if (!profile.codeName) {
            const codeName = generateCodeName();
            try {
              await updateDoc(doc(db, "users", user.uid), { codeName });
              profile.codeName = codeName;
            } catch {
              profile.codeName = `User${user.uid.substring(0, 6)}`;
            }
          }
          if (!profile.referralCode) {
            const referralCode = generateReferralCode();
            try {
              await updateDoc(doc(db, "users", user.uid), { referralCode });
              profile.referralCode = referralCode;
            } catch {
              // Non-fatal
            }
          }
          setUserProfile(profile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string, referredBy?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    const profile: UserProfile = {
      uid: cred.user.uid,
      email,
      displayName,
      codeName: generateCodeName(),
      isAdmin: false,
      referralCode: generateReferralCode(),
      ...(referredBy ? { referredBy } : {}),
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), profile);
    setUserProfile(profile);

    // Send verification email after signup
    try {
      await sendEmailVerification(cred.user);
    } catch {
      // Non-fatal — user can resend later
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const resendVerification = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user);
    }
  };

  const refreshVerification = async (): Promise<boolean> => {
    if (user) {
      await user.reload();
      const verified = user.emailVerified;
      setEmailVerified(verified);
      return verified;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        emailVerified,
        signIn,
        signUp,
        signOut,
        resendVerification,
        refreshVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
