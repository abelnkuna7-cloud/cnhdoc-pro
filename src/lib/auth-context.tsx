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
const COSSA_ORGANISATION_ID = "00000000-0000-4000-8000-000000000001";

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
  const billingMembership =
    memberships.find((row) => row.role === "owner" || row.role === "admin") ??
    null;
  const cossaMembership = memberships.find(
    (row) =>
      row.organisation_id === COSSA_ORGANISATION_ID &&
      (row.role === "owner" || row.role === "admin"),
  ) ?? null;
  const isAdmin =
    Boolean(cossaMembership) ||
    (roleRows ?? []).some((row) => row.role === "admin");

  const createdAt = user.created_at
    ? new Date(user.created_at).getTime()
    : Date.now();
  const organisationId = cossaMembership?.organisation_id ?? billingMembership?.organisation_id ?? null;

  const { data: subscriptionRows } = organisationId
    ? await supabase
        .from("organisation_subscriptions")
        .select("status,current_period_ends_at,trial_ends_at")
        .eq("organisation_id", organisationId)
        .order("updated_at", { ascending: false })
        .limit(1)
    : { data: [] };

  const subscription = subscriptionRows?.[0] ?? null;
  const periodEndsAt = subscription?.current_period_ends_at
    ? new Date(subscription.current_period_ends_at).getTime()
    : 0;
  const trialEndsAt = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at).getTime()
    : createdAt + 10 * 24 * 60 * 60 * 1000;
  const subscriptionStatus: UserProfile["subscriptionStatus"] =
    cossaMembership || (subscription?.status === "active" && periodEndsAt > Date.now())
      ? "active"
      : trialEndsAt > Date.now()
        ? "trial"
        : subscription?.status === "cancelled"
          ? "cancelled"
          : "expired";

  return {
    uid: user.id,
    email: user.email ?? "",
    displayName: toAppUser(user).displayName,
    createdAt,
    trialEndsAt,
    subscriptionStatus,
    isAdmin,
    organisationId,
    isCossaWorkspace: Boolean(cossaMembership),
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
  if (!profile || profile.subscriptionStatus === "active") return 0;
  const remaining = profile.trialEndsAt - Date.now();
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
