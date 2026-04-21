// Public cron endpoint — pg_cron POSTs here daily to refresh the curated catalog.
// Lives under /api/public/* so the platform's auth wrapper does not block it.
// We still validate the bearer token to avoid drive-by abuse.

import { createFileRoute } from "@tanstack/react-router";
import { runCatalogRefresh } from "@/server/catalog-refresh";

export const Route = createFileRoute("/api/public/cron/refresh-catalog")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization");
        const token = auth?.replace(/^Bearer\s+/i, "");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!token || !expected || token !== expected) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        const result = await runCatalogRefresh({ pages: 3, maxInserts: 24 });
        return new Response(JSON.stringify(result), {
          status: result.ok ? 200 : 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
