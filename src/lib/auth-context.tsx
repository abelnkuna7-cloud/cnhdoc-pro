import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: number;
  trialEndsAt: number;
  subscriptionStatus: "trial" | "active" | "expired" | "cancelled";
  isAdmin: boolean;
  organisationId: string | null;
  isCossaWorkspace: boolean;
};

type AuthCtx = {
  user: AppUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

function toAppUser(user: SupabaseUser): AppUser {
  return {
    uid: user.id,
    email: user.email ?? "",
    displayName:
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : typeof user.user_metadata?.full_name === "string"
          ? user.user_metadata.full_name
          : "",
  };
}

async function loadProfile(user: SupabaseUser): Promise<UserProfile> {
  const [{ data: roleRows }, { data: membershipRows }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id),
    supabase
      .from("organisation_members")
      .select("organisation_id, role")
      .eq("user_id", user.id),
  ]);

  const memberships = membershipRows ?? [];
  const privilegedMembership =
    memberships.find((row) => row.role === "owner" || row.role === "admin") ??
    null;
  const isAdmin =
    Boolean(privilegedMembership) ||
    (roleRows ?? []).some((row) => row.role === "admin");

  const createdAt = user.created_at
    ? new Date(user.created_at).getTime()
    : Date.now();

  return {
    uid: user.id,
    email: user.email ?? "",
    displayName: toAppUser(user).displayName,
    createdAt,
    trialEndsAt: createdAt + 10 * 24 * 60 * 60 * 1000,
    subscriptionStatus: "active",
    isAdmin,
    organisationId: privilegedMembership?.organisation_id ?? null,
    isCossaWorkspace: isAdmin && Boolean(privilegedMembership?.organisation_id),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(toAppUser(supabaseUser));
    try {
      setProfile(await loadProfile(supabaseUser));
    } catch (error) {
      console.error("NexDocs profile load failed", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const initialise = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) await hydrate(data.session?.user ?? null);
    };

    void initialise();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) void hydrate(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    await hydrate(data.user ?? null);
  };

  const value: AuthCtx = {
    user,
    profile,
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    signUp: async (email, password, displayName) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            full_name: displayName,
          },
        },
      });
      if (error) throw error;
      if (!data.session) {
        throw new Error(
          "Please check your email to confirm your NexDocs account, then sign in.",
        );
      }
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth",
      });
      if (error) throw error;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export function hasActiveAccess(profile: UserProfile | null): boolean {
  return Boolean(profile) && profile.subscriptionStatus !== "expired";
}

export function daysLeft(profile: UserProfile | null): number {
  if (!profile || profile.subscriptionStatus === "active") return 10;
  const remaining = profile.trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
