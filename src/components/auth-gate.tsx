import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Client-side guard. Redirects to /auth?redirect=<current-path> when the user
 * is not signed in. Renders children once a session is present.
 *
 * Hardened against redirect loops:
 *  - Never redirects when already on /auth
 *  - Sends only pathname (no nested ?redirect= chains)
 *  - Fires the navigate at most once per mount
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (session) return;
    if (redirectedRef.current) return;
    // Never bounce /auth -> /auth
    if (location.pathname.startsWith("/auth")) return;

    redirectedRef.current = true;
    // Use pathname only — keeps the URL clean and prevents stacked ?redirect=
    navigate({
      to: "/auth",
      search: { redirect: location.pathname },
      replace: true,
    });
  }, [session, loading, navigate, location.pathname]);

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
