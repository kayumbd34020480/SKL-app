"use client";

import React from "react"

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { BanNoticeModal } from "@/components/ban-notice-modal";
import { PendingApprovalModal } from "@/components/pending-approval-modal";
import { RejectedAccountModal } from "@/components/rejected-account-modal";
import dynamic from "next/dynamic";

// Dynamic import to avoid issues with section loader context
const SectionLoaderConsumer = dynamic(() => 
  import("@/contexts/section-loader-context").then(mod => ({ 
    default: ({ children }: { children: (context: any) => React.ReactNode }) => {
      // This is a placeholder - we'll handle it differently
      return <>{children(null)}</>;
    }
  })), 
  { ssr: false }
);

const ADMIN_EMAIL = "kayumislam1001@gmail.com";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  balance: number;
  role: "admin" | "user";
  isBanned: boolean;
  isApproved: boolean;
  isRejected: boolean;
  badge?: "MEMBER" | "PREMIUM" | "VIP" | null;
  createdAt: Date;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showRejectedModal, setShowRejectedModal] = useState(false);
  const previousBanStatus = useRef<boolean | null>(null);

  const fetchUserProfile = async (uid: string) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      // For existing users without isApproved field, treat them as approved
      // Only new users will have isApproved explicitly set to false
      const isApproved = data.isApproved === undefined ? true : data.isApproved;
      return {
        uid,
        email: data.email,
        displayName: data.displayName,
        balance: data.balance || 0,
        role: data.role || "user",
        isBanned: data.isBanned || false,
        isApproved,
        isRejected: data.isRejected || false,
        badge: data.badge || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        phone: data.phone,
        address: data.address,
        avatarUrl: data.avatarUrl,
      } as UserProfile;
    }
    return null;
  };

  const refreshUserProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // Unsubscribe from previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      
      if (user) {
        // Set up real-time listener for user profile
        unsubscribeProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const isBanned = data.isBanned || false;
            // For existing users without isApproved field, treat them as approved
            const isApproved = data.isApproved === undefined ? true : data.isApproved;
            const isRejected = data.isRejected || false;
            const isAdmin = data.role === "admin";
            
            // Show ban modal if user is banned (not forced - user can dismiss by logging out)
            if (isBanned) {
              setShowBanModal(true);
            } else {
              setShowBanModal(false);
            }
            
            // Show pending modal for non-admin users who are not approved and not rejected
            if (!isAdmin && !isApproved && !isRejected && !isBanned) {
              setShowPendingModal(true);
            } else {
              setShowPendingModal(false);
            }
            
            // Show rejected modal for users who are rejected
            if (!isAdmin && isRejected && !isBanned) {
              setShowRejectedModal(true);
            } else {
              setShowRejectedModal(false);
            }
            
            // Update previous ban status for next comparison
            previousBanStatus.current = isBanned;
            
            setUserProfile({
              uid: user.uid,
              email: data.email,
              displayName: data.displayName,
              balance: data.balance || 0,
              role: data.role || "user",
              isBanned,
              isApproved,
              isRejected,
              badge: data.badge || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              phone: data.phone,
              address: data.address,
              avatarUrl: data.avatarUrl,
            });
          } else {
            setUserProfile(null);
            previousBanStatus.current = null;
          }
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        previousBanStatus.current = null;
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await fetchUserProfile(result.user.uid);
    
    if (profile?.isBanned) {
      await firebaseSignOut(auth);
      throw new Error("Your account has been banned. Please contact support.");
    }
    
    // Don't force logout for rejected accounts - let them see the rejected modal
    // if (profile?.isRejected) {
    //   await firebaseSignOut(auth);
    //   throw new Error("Your registration request has been rejected. Please contact support.");
    // }
    
    // Initialize the previous ban status when signing in
    previousBanStatus.current = profile?.isBanned || false;
    
    setUserProfile(profile);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    
    const newUserProfile: Omit<UserProfile, "uid"> = {
      email,
      displayName,
      balance: 0,
      role: isAdmin ? "admin" : "user",
      isBanned: false,
      isApproved: isAdmin, // Admin is auto-approved
      isRejected: false,
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", result.user.uid), {
      ...newUserProfile,
      createdAt: serverTimestamp(),
    });

    // Initialize ban status for new user
    previousBanStatus.current = false;

    setUserProfile({ ...newUserProfile, uid: result.user.uid });
  };

  const signOut = async () => {
    setShowBanModal(false);
    setShowPendingModal(false);
    setShowRejectedModal(false);
    previousBanStatus.current = null;
    
    // Disable section loader before signing out to prevent auto-redirect loader
    try {
      const sectionLoaderCtx = (window as any).__sectionLoaderContext;
      if (sectionLoaderCtx?.hideLoader) {
        sectionLoaderCtx.hideLoader();
      }
    } catch (e) {
      // Silently handle if context is not available
    }
    
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const handleModalLogout = async () => {
    await signOut();
  };

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      isAdmin,
      signIn, 
      signUp, 
      signOut,
      refreshUserProfile 
    }}>
      {children}
      <BanNoticeModal isOpen={showBanModal} onLogout={handleModalLogout} />
      <PendingApprovalModal isOpen={showPendingModal} onLogout={handleModalLogout} userEmail={userProfile?.email} />
      <RejectedAccountModal isOpen={showRejectedModal} onLogout={handleModalLogout} />
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
