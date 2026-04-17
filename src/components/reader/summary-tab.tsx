import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownProse } from "@/components/markdown-prose";
import { generateChapterSummary } from "@/server/ai";

export function SummaryTab({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    setContent("");
    try {
      const res = await generateChapterSummary({ data: { slug: bookId, chapter } });
      if (res.error) setError(res.error);
      else setContent(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapter]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-walnut">
          <Loader2 className="h-4 w-4 animate-spin" /> Composing your scholarly analysis…
        </div>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
        <Skeleton className="mt-6 h-6 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-9/12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-serif italic text-espresso">{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-3">
          <RefreshCw className="mr-2 h-3 w-3" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div>
      <MarkdownProse content={content} />
      <Button onClick={load} variant="ghost" size="sm" className="mt-6 text-walnut">
        <RefreshCw className="mr-2 h-3 w-3" /> Regenerate
      </Button>
    </div>
  );
}
