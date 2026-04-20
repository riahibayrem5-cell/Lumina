import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { MentorBookCard } from "@/components/mentor-book-card";
import { listMentorBooks, type MentorBookRow } from "@/server/mentor-library";

export function MentorShelfPanel() {
  const [books, setBooks] = useState<MentorBookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    listMentorBooks().then((r) => {
      if (!r.error) setBooks(r.books);
      setLoading(false);
    });
  }, []);

  const eras = useMemo(() => {
    const set = new Set<string>();
    for (const b of books) if (b.era) set.add(b.era);
    return ["All", ...Array.from(set)];
  }, [books]);

  const filtered = filter === "All" ? books : books.filter((b) => b.era === filter);
  const featured = filtered.filter((b) => b.featured);
  const rest = filtered.filter((b) => !b.featured);

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-card via-card to-secondary/40 p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold" />
          <h3 className="font-display text-xl text-obsidian">The Mentor Library</h3>
        </div>
        <p className="mt-2 max-w-2xl font-serif text-sm italic text-espresso/70">
          Famous modern works we cannot host the text of — but a mentor can still walk you
          through them. Open any title for an AI-generated overview, then drill into individual
          chapters for guided notes.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-walnut">
          <Loader2 className="h-4 w-4 animate-spin" /> Gathering the mentor's shelf…
        </div>
      ) : books.length === 0 ? (
        <p className="font-serif italic text-espresso/70">No mentor books available yet.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {eras.map((e) => {
              const isActive = filter === e;
              return (
                <button
                  key={e}
                  onClick={() => setFilter(e)}
                  className={`rounded-full border px-3 py-1 font-sans text-xs uppercase tracking-wider transition ${
                    isActive
                      ? "border-walnut bg-walnut text-ivory shadow-paper"
                      : "border-border/70 bg-background/60 text-espresso/70 hover:border-gold/70 hover:text-mahogany"
                  }`}
                >
                  {e}
                </button>
              );
            })}
          </div>

          {featured.length > 0 && (
            <section>
              <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-walnut">
                Editor's picks
              </p>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {featured.map((b, i) => (
                  <MentorBookCard key={b.id} book={b} index={i} />
                ))}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section>
              <p className="mb-4 font-sans text-xs uppercase tracking-[0.3em] text-walnut">
                More on the shelf
              </p>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {rest.map((b, i) => (
                  <MentorBookCard key={b.id} book={b} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
