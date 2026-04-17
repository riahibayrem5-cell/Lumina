// Client-side middleware that forwards the current Supabase access token to
// server functions as an `Authorization: Bearer <token>` header so that
// `requireSupabaseAuth` can authenticate the request.
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

export const sendSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
    } catch {
      token = null;
    }
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
