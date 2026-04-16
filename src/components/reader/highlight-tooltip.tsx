import { useState } from "react";
import { Loader2, Bookmark } from "lucide-react";
import { analyzeHighlight } from "@/server/ai";
import { useReadingStore } from "@/store/reading";
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

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await analyzeHighlight({ data: { bookId, chapter, sentence } });
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
    toast.success("Highlight saved");
    onClose();
  };

  // Clamp tooltip width and position
  const left = Math.min(Math.max(position.x, 200), window.innerWidth - 200);
  const top = position.y + 12;

  return (
    <div
      role="dialog"
      aria-label="Highlight actions"
      className="fixed z-50 w-80 -translate-x-1/2 rounded-xl border border-border bg-popover p-4 shadow-tome"
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="mb-3 font-serif text-sm italic leading-snug text-espresso/80 line-clamp-3">
        "{sentence}"
      </p>
      {analysis ? (
        <p className="mb-3 rounded-lg bg-secondary/50 p-3 font-serif text-sm leading-relaxed text-espresso">
          {analysis}
        </p>
      ) : (
        <button
          onClick={analyze}
          disabled={loading}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-walnut bg-walnut px-3 py-2 font-sans text-xs uppercase tracking-wider text-ivory transition hover:bg-mahogany disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          {loading ? "Reading…" : "Illuminate"}
        </button>
      )}
      <div className="flex gap-2">
        <button
          onClick={save}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-sans text-xs uppercase tracking-wider text-espresso transition hover:border-gold hover:text-mahogany"
        >
          <Bookmark className="h-3 w-3" /> Save
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-border bg-background px-3 py-2 font-sans text-xs uppercase tracking-wider text-espresso/60 transition hover:text-mahogany"
        >
          Close
        </button>
      </div>
    </div>
  );
}
