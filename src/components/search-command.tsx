import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CATALOG } from "@/lib/catalog";
import { Search } from "lucide-react";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-5 py-4 text-left shadow-paper backdrop-blur transition-all hover:border-gold/60 hover:shadow-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <Search className="h-4 w-4 text-walnut" />
        <span className="flex-1 font-serif text-sm italic text-muted-foreground">
          Search the library — title, author, mood…
        </span>
        <kbd className="hidden rounded border border-border/70 bg-background px-1.5 py-0.5 font-sans text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search by title, author, era, or mood…" />
        <CommandList>
          <CommandEmpty>No volumes match that query.</CommandEmpty>
          <CommandGroup heading="The Library">
            {CATALOG.map((b) => (
              <CommandItem
                key={b.id}
                value={`${b.title} ${b.author} ${b.era} ${b.genre.join(" ")} ${b.moods.join(" ")}`}
                onSelect={() => {
                  setOpen(false);
                  navigate({ to: "/read/$bookId/$chapter", params: { bookId: b.id, chapter: "0" } });
                }}
              >
                <div className="flex flex-col">
                  <span className="font-display text-base">{b.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {b.author} · {b.year} · {b.era}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
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
