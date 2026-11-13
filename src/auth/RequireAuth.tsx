import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/** Gate for pages that need a connected wallet: waits for the kit, sends visitors without one home. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { ready, authenticated } = useAuth();
  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0e0d12]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-brand-600" />
      </div>
    );
  }
  if (!authenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}
