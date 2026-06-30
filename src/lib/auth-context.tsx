import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getFirebaseAuth, getDb, ADMIN_EMAIL, TRIAL_DAYS } from "./firebase";

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number;
  trialEndsAt: number;
  subscriptionStatus: "trial" | "active" | "expired" | "cancelled";
  isAdmin: boolean;
};

type AuthCtx = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

async function loadOrCreateProfile(user: User): Promise<UserProfile> {
  const db = getDb();
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const isAdmin = (user.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (snap.exists()) {
    const d = snap.data() as Record<string, unknown>;
    const createdAt = d.createdAt instanceof Timestamp ? d.createdAt.toMillis() : Date.now();
    const trialEndsAt = typeof d.trialEndsAt === "number"
      ? d.trialEndsAt
      : createdAt + TRIAL_DAYS * 24 * 60 * 60 * 1000;
    return {
      uid: user.uid,
      email: user.email ?? "",
      displayName: (d.displayName as string) ?? user.displayName ?? "",
      createdAt,
      trialEndsAt,
      subscriptionStatus: (d.subscriptionStatus as UserProfile["subscriptionStatus"]) ?? "trial",
      isAdmin,
    };
  }
  const now = Date.now();
  const trialEndsAt = now + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  await setDoc(ref, {
    email: user.email,
    displayName: user.displayName ?? "",
    createdAt: serverTimestamp(),
    trialEndsAt,
    subscriptionStatus: "trial",
  });
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    createdAt: now,
    trialEndsAt,
    subscriptionStatus: "trial",
    isAdmin,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await loadOrCreateProfile(u);
          setProfile(p);
        } catch (e) {
          console.error("profile load failed", e);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refresh = async () => {
    if (!user) return;
    const p = await loadOrCreateProfile(user);
    setProfile(p);
  };

  const value: AuthCtx = {
    user,
    profile,
    loading,
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    },
    signUp: async (email, password, displayName) => {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      const now = Date.now();
      await setDoc(doc(getDb(), "users", cred.user.uid), {
        email,
        displayName,
        createdAt: serverTimestamp(),
        trialEndsAt: now + TRIAL_DAYS * 24 * 60 * 60 * 1000,
        subscriptionStatus: "trial",
      });
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(getFirebaseAuth(), email, {
        url: window.location.origin + "/auth",
      });
    },
    signOut: async () => {
      await fbSignOut(getFirebaseAuth());
    },
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function hasActiveAccess(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.isAdmin) return true; // CEO / admin — no limits
  if (profile.subscriptionStatus === "active") return true;
  if (profile.subscriptionStatus === "trial" && profile.trialEndsAt > Date.now()) return true;
  return false;
}

export function daysLeft(profile: UserProfile | null): number {
  if (!profile) return 0;
  const ms = profile.trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}
