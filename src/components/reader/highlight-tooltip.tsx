import { useState } from "react";
import { Loader2, Bookmark, Sparkles, X } from "lucide-react";
import { analyzeHighlight } from "@/server/ai";
import { addHighlight as addHighlightFn } from "@/server/library";
import { useReadingStore } from "@/store/reading";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface Props {
  bookId: string;
  chapter: number;
  sentence: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function HighlightTooltip({ bookId, chapter, sentence, position, onClose }: Props) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const addHighlight = useReadingStore((s) => s.addHighlight);
  const { session } = useAuth();

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeHighlight({ data: { slug: bookId, chapter, sentence } });
      setAnalysis(res.error ? `(${res.error})` : res.content);
    } catch (e) {
      setAnalysis(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    addHighlight({
      id: crypto.randomUUID(),
      bookId,
      chapter,
      text: sentence,
      createdAt: Date.now(),
    });
    if (session) {
      addHighlightFn({ data: { slug: bookId, chapter, text: sentence } }).catch(() => {});
    }
    toast.success("Highlight saved to your shelf");
    onClose();
  };

  // Clamp tooltip width and position
  const left = Math.min(Math.max(position.x, 200), window.innerWidth - 200);
  const top = position.y + 12;

  return (
    <div
      role="dialog"
      aria-label="Highlight actions"
      className="fixed z-50 w-[22rem] -translate-x-1/2 overflow-hidden rounded-2xl border border-border/80 bg-popover/95 shadow-tome backdrop-blur-md ring-1 ring-gold/10"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Decorative gold rule */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold/60 to-transparent" aria-hidden />

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <p className="font-serif text-sm italic leading-snug text-espresso/85 line-clamp-3">
            “{sentence}”
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground/70 transition hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {analysis ? (
          <div className="mb-3 rounded-lg border border-border/60 bg-secondary/40 p-3">
            <p className="mb-1 flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-[0.18em] text-walnut">
              <Sparkles className="h-3 w-3" /> Mentor's note
            </p>
            <p className="font-serif text-sm leading-relaxed text-espresso">{analysis}</p>
          </div>
        ) : (
          <button
            onClick={analyze}
            disabled={loading}
            className="group mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-walnut bg-walnut px-3 py-2.5 font-sans text-xs uppercase tracking-[0.2em] text-ivory transition hover:bg-mahogany hover:shadow-leaf disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            )}
            {loading ? "Reading…" : "Illuminate"}
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background/70 px-3 py-2 font-sans text-xs uppercase tracking-[0.18em] text-espresso transition hover:border-gold hover:text-mahogany"
          >
            <Bookmark className="h-3.5 w-3.5" /> Save
          </button>
          {analysis && (
            <button
              onClick={() => setAnalysis("")}
              className="rounded-lg border border-border bg-background/70 px-3 py-2 font-sans text-xs uppercase tracking-[0.18em] text-espresso/70 transition hover:border-gold hover:text-mahogany"
            >
              Re-read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
