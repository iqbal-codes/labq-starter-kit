import { createContext, use, useMemo, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

interface AuthContextValue {
  session: Record<string, unknown> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: typeof authClient.signIn;
  signUp: typeof authClient.signUp;
  signOut: () => Promise<void>;
  refetchSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    await authClient.signOut();
    void navigate("/auth/sign-in");
  }, [navigate]);

  const refetchSession = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo(
    () => ({
      session: session ?? null,
      isLoading: isPending,
      isAuthenticated: !!session,
      signIn: authClient.signIn,
      signUp: authClient.signUp,
      signOut: handleSignOut,
      refetchSession,
    }),
    [session, isPending, handleSignOut, refetchSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
