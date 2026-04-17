import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Lumina Books" },
      { name: "description", content: "Sign in to save your library, progress, highlights, and AI history." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { session, loading: authLoading } = useAuth();

  // After sign-in (or if already signed in), bounce back to the requested URL
  useEffect(() => {
    if (!authLoading && session) {
      const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";
      window.location.assign(target);
    }
  }, [session, authLoading, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        // session effect will redirect to search.redirect
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    if (oauthLoading) return;
    setOauthLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setOauthLoading(false);
        return;
      }
      if (result.redirected) return;
      // Tokens were set directly — session effect will handle redirect.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setOauthLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: marketing pane */}
      <div className="relative hidden overflow-hidden bg-walnut text-ivory lg:block">
        <div className="grain absolute inset-0 opacity-30" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-ivory text-walnut">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-display text-xl">Lumina Books</span>
          </Link>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.4em] text-ivory/70">
              An AI Literary Companion
            </p>
            <h1 className="mt-4 font-display text-4xl leading-[1.1] xl:text-5xl">
              Your library,
              <br />
              <em className="font-normal italic text-gold">illuminated.</em>
            </h1>
            <p className="mt-6 max-w-md font-serif italic leading-relaxed text-ivory/80">
              Sign in to save your reading progress, highlights, mentor notes, and chapter
              illustrations across every device.
            </p>
          </div>
          <p className="font-sans text-xs uppercase tracking-[0.3em] text-ivory/50">
            Public-domain literature · per-account cloud sync
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-display text-lg text-obsidian">Lumina Books</span>
          </Link>

          <h2 className="font-display text-3xl text-obsidian">
            {mode === "sign-in" ? "Welcome back." : "Open your library."}
          </h2>
          <p className="mt-2 font-serif italic text-espresso/70">
            {mode === "sign-in"
              ? "Sign in to continue reading."
              : "Create an account — your shelf will follow you."}
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={google}
            disabled={oauthLoading}
            className="mt-8 w-full justify-center gap-3 border-border/80 bg-background py-6 text-sm font-medium hover:border-gold"
          >
            {oauthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "sign-up" && (
              <div>
                <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-walnut">
                  Display name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Charlotte Brontë"
                  className="mt-2"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-walnut">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-walnut">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full py-6">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {mode === "sign-in" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center font-serif text-sm italic text-espresso/70">
            {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="font-medium not-italic text-walnut underline-offset-4 hover:text-mahogany hover:underline"
            >
              {mode === "sign-in" ? "Create one" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EA4335"
        d="M12 11v3.2h4.5c-.2 1.2-1.4 3.5-4.5 3.5-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.7 3.2 1.2l2.2-2.1C15.9 5.5 14.1 4.7 12 4.7 7.9 4.7 4.6 8 4.6 12s3.3 7.3 7.4 7.3c4.3 0 7.1-3 7.1-7.2 0-.5-.1-.8-.1-1.1H12z"
      />
    </svg>
  );
}
