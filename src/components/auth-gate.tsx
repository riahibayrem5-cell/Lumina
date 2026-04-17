import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side guard. Redirects to /auth?redirect=<current-href> when the user
 * is not signed in. Renders children once a session is present.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  }, [session, loading, navigate, location.href]);

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center text-walnut">
        <div className="flex items-center gap-3 font-serif italic">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loading ? "Opening your library…" : "Redirecting to sign in…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
