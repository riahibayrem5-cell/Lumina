import { useState } from "react";
import { Loader2, Sparkles, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { generateChapterImage } from "@/server/ai";

const STYLES = [
  { id: "vintage-oil", label: "Vintage Oil" },
  { id: "cinematic-noir", label: "Cinematic Noir" },
  { id: "watercolor", label: "Watercolor" },
  { id: "woodcut", label: "Woodcut" },
] as const;

type Style = (typeof STYLES)[number]["id"];

export function VisualsTab({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [style, setStyle] = useState<Style>("vintage-oil");
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (s: Style) => {
    setLoading(true);
    setError(null);
    setImageUrl("");
    try {
      const res = await generateChapterImage({ data: { bookId, chapter, style: s } });
      if (res.error) setError(res.error);
      else {
        setImageUrl(res.imageUrl);
        setPrompt(res.prompt);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setStyle(s.id);
              generate(s.id);
            }}
            disabled={loading}
            className={`rounded-full border px-3 py-1 font-sans text-xs uppercase tracking-wider transition ${
              style === s.id
                ? "border-walnut bg-walnut text-ivory"
                : "border-border bg-background text-espresso/70 hover:border-gold"
            } disabled:opacity-50`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!imageUrl && !loading && !error && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
          <Sparkles className="mx-auto mb-3 h-6 w-6 text-gold" />
          <p className="font-serif italic text-espresso/70">
            Choose a style above to illuminate this chapter.
          </p>
          <Button onClick={() => generate(style)} variant="default" className="mt-4">
            Conjure illustration
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="flex items-center gap-2 text-sm text-walnut">
            <Loader2 className="h-4 w-4 animate-spin" /> Painting the scene…
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-serif italic">{error}</p>
          <Button onClick={() => generate(style)} variant="outline" size="sm" className="mt-3">
            Try again
          </Button>
        </div>
      )}

      {imageUrl && !loading && (
        <figure className="space-y-3">
          <img
            src={imageUrl}
            alt={`Illustration of this chapter in ${style} style`}
            className="w-full rounded-xl border border-border shadow-leaf"
          />
          <figcaption className="font-serif text-xs italic leading-relaxed text-muted-foreground">
            {prompt}
          </figcaption>
          <a
            href={imageUrl}
            download={`lumina-${bookId}-ch${chapter + 1}.png`}
            className="inline-flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider text-walnut hover:text-mahogany"
          >
            <Download className="h-3 w-3" /> Save image
          </a>
        </figure>
      )}
    </div>
  );
}
