import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { CATALOG } from "@/lib/catalog";
import { Search, BookOpen, Loader2, Sparkles } from "lucide-react";
import { searchBooks, getOrCreateBook, type SearchResult } from "@/server/books";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [remote, setRemote] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();

  // Cmd+K binding
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounce query
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  // Run remote search
  const reqRef = useRef(0);
  useEffect(() => {
    if (!debounced || debounced.length < 2) {
      setRemote([]);
      setSearching(false);
      return;
    }
    const myReq = ++reqRef.current;
    setSearching(true);
    searchBooks({ data: { query: debounced } })
      .then((res) => {
        if (myReq !== reqRef.current) return;
        setRemote(res.results ?? []);
      })
      .catch(() => {
        if (myReq !== reqRef.current) return;
        setRemote([]);
      })
      .finally(() => {
        if (myReq === reqRef.current) setSearching(false);
      });
  }, [debounced]);

  // De-dup curated suggestions when remote results have the same slug
  const curated = useMemo(() => {
    if (debounced.length >= 2) return [];
    return CATALOG.slice(0, 8);
  }, [debounced]);

  const openResult = async (r: SearchResult) => {
    if (resolving) return;
    setResolving(r.slug);
    try {
      const res = await getOrCreateBook({
        data: {
          slug: r.slug,
          title: r.title,
          author: r.author,
          year: r.year,
          cover_url: r.cover_url,
          gutenberg_id: r.gutenberg_id,
          open_library_id: r.open_library_id,
        },
      });
      if (res.error || !res.book) {
        toast.error(res.error ?? "Could not open that book");
        return;
      }
      setOpen(false);
      // If we have full text, jump straight into the reader; else go to detail page
      if (res.book.source === "gutenberg" && res.book.gutenberg_id) {
        navigate({
          to: "/read/$bookId/$chapter",
          params: { bookId: res.book.slug, chapter: "0" },
        });
      } else {
        navigate({ to: "/book/$slug", params: { slug: res.book.slug } });
      }
    } finally {
      setResolving(null);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-5 py-4 text-left shadow-paper backdrop-blur transition-all hover:border-gold/60 hover:shadow-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <Search className="h-4 w-4 text-walnut" />
        <span className="flex-1 font-serif text-sm italic text-muted-foreground">
          Type any book — title, author, or ISBN…
        </span>
        <kbd className="hidden rounded border border-border/70 bg-background px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search any book — title or author…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {searching && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-walnut">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching the world's libraries…
            </div>
          )}

          {!searching && debounced.length >= 2 && remote.length === 0 && (
            <CommandEmpty>No books found for "{debounced}".</CommandEmpty>
          )}

          {curated.length > 0 && (
            <CommandGroup heading="Curated Classics">
              {curated.map((b) => (
                <CommandItem
                  key={b.id}
                  value={`${b.title} ${b.author} ${b.era} ${b.genre.join(" ")}`}
                  onSelect={() => {
                    setOpen(false);
                    navigate({
                      to: "/read/$bookId/$chapter",
                      params: { bookId: b.id, chapter: "0" },
                    });
                  }}
                >
                  <BookOpen className="mr-2 h-3.5 w-3.5 text-walnut" />
                  <div className="flex flex-col">
                    <span className="font-display text-sm">{b.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {b.author} · {b.year}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {remote.length > 0 && (
            <>
              {curated.length > 0 && <CommandSeparator />}
              <CommandGroup heading="Search Results">
                {remote.map((r) => (
                  <CommandItem
                    key={`${r.slug}-${r.source}`}
                    value={`${r.title} ${r.author} ${r.slug}`}
                    onSelect={() => openResult(r)}
                  >
                    {resolving === r.slug ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-walnut" />
                    ) : r.source === "gutenberg" || r.source === "curated" ? (
                      <BookOpen className="mr-2 h-3.5 w-3.5 text-walnut" />
                    ) : (
                      <Sparkles className="mr-2 h-3.5 w-3.5 text-gold" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-display text-sm">{r.title}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {r.author}
                        {r.year ? ` · ${r.year}` : ""}
                      </span>
                    </div>
                    <span className="ml-2 shrink-0 rounded-full border border-border bg-background px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.source === "curated" || r.source === "gutenberg" ? "Read free" : "Mentor only"}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export function FilterableGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

export function useFilteredCatalog(active: string | null) {
  return useMemo(() => {
    if (!active || active === "All") return CATALOG;
    return CATALOG.filter(
      (b) => b.era === active || b.genre.includes(active) || b.moods.includes(active as never),
    );
  }, [active]);
}
