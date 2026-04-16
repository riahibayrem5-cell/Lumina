import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownProse } from "@/components/markdown-prose";
import { generateMentorGuide } from "@/server/ai";

export function MentorTab({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateMentorGuide({ data: { bookId, chapter } });
      if (res.error) setError(res.error);
      else setContent(res.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
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
          <Loader2 className="h-4 w-4 animate-spin" /> The mentor gathers her thoughts…
        </div>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-serif italic">{error}</p>
        <Button onClick={load} variant="outline" size="sm" className="mt-3">
          <RefreshCw className="mr-2 h-3 w-3" /> Try again
        </Button>
      </div>
    );
  }

  return <MarkdownProse content={content} />;
}
