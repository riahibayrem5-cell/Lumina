import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { BookCard } from "@/components/book-card";
import { SearchCommand, FilterableGrid, useFilteredCatalog } from "@/components/search-command";
import { CATALOG } from "@/lib/catalog";
import { ArrowDown } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumina Books — Rediscover the Classics" },
      {
        name: "description",
        content:
          "An AI-powered literary companion. Read public-domain classics with chapter summaries, mentor guides, illustrations, and conversation grounded in the text.",
      },
      { property: "og:title", content: "Lumina Books — Rediscover the Classics" },
      {
        property: "og:description",
        content:
          "Read Frankenstein, Pride & Prejudice, Dracula and more — paired with an AI companion who knows the page you're on.",
      },
    ],
  }),
  component: LandingPage,
});

const FILTERS = ["All", "Romantic", "Victorian", "Modernist", "Gothic", "Mystery", "Melancholic", "Romance"];

function LandingPage() {
  const [active, setActive] = useState<string>("All");
  const filtered = useFilteredCatalog(active);
  const featured = CATALOG.slice(0, 4);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="grain absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex min-h-[78vh] w-full max-w-5xl flex-col items-center justify-center px-6 py-20 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="mb-6 font-sans text-xs uppercase tracking-[0.4em] text-walnut"
          >
            An AI Literary Companion
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl font-medium leading-[1.05] text-obsidian sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Rediscover
            <br />
            <em className="font-normal italic text-walnut">the Classics.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="mt-8 max-w-xl font-serif text-lg italic leading-relaxed text-espresso/80"
          >
            A quiet study of public-domain literature, paired with a mentor who reads alongside you —
            offering context, illustration, and conversation, page by page.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="mt-10 w-full max-w-xl"
          >
            <SearchCommand />
          </motion.div>

          <a
            href="#explore"
            className="mt-16 inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 font-sans text-xs uppercase tracking-widest text-walnut transition hover:border-gold hover:text-mahogany"
          >
            Explore the shelves <ArrowDown className="h-3 w-3" />
          </a>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto w-full max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-walnut">Featured</p>
            <h2 className="mt-2 font-display text-3xl text-obsidian sm:text-4xl">Curated Tonight</h2>
          </div>
          <Link to="/library" className="hidden font-sans text-sm text-walnut hover:text-mahogany sm:inline">
            See your library →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {featured.map((b, i) => (
            <BookCard key={b.id} book={b} index={i} />
          ))}
        </div>
      </section>

      {/* EXPLORE */}
      <section id="explore" className="border-t border-border/50 bg-card/40">
        <div className="mx-auto w-full max-w-7xl px-6 py-20">
          <div className="mb-8">
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-walnut">The Stacks</p>
            <h2 className="mt-2 font-display text-3xl text-obsidian sm:text-4xl">Browse the Shelves</h2>
          </div>

          <div className="mb-10 flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const isActive = active === f;
              return (
                <button
                  key={f}
                  onClick={() => setActive(f)}
                  className={`rounded-full border px-4 py-1.5 font-sans text-xs uppercase tracking-wider transition ${
                    isActive
                      ? "border-walnut bg-walnut text-ivory shadow-paper"
                      : "border-border/70 bg-background/60 text-espresso/70 hover:border-gold/70 hover:text-mahogany"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <FilterableGrid>
            {filtered.map((b, i) => (
              <BookCard key={b.id} book={b} index={i} />
            ))}
          </FilterableGrid>
        </div>
      </section>

      <footer className="border-t border-border/50 py-10 text-center font-sans text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Lumina Books · Public-domain literature, illuminated.
      </footer>
    </div>
  );
}
