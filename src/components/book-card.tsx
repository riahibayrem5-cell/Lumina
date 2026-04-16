import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { coverUrl, type Book } from "@/lib/catalog";

interface Props {
  book: Book;
  index?: number;
}

export function BookCard({ book, index = 0 }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Link
        to="/read/$bookId/$chapter"
        params={{ bookId: book.id, chapter: "0" }}
        className="group block overflow-hidden rounded-xl border border-border/70 bg-card shadow-paper transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:shadow-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-secondary">
          {!imgFailed ? (
            <img
              src={coverUrl(book)}
              alt={`Cover of ${book.title}`}
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-br from-mahogany to-espresso text-ivory">
              <div className="font-display text-2xl leading-tight">{book.title}</div>
              <div className="text-xs uppercase tracking-[0.2em] opacity-70">{book.author}</div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-obsidian/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute right-3 top-3 rounded-full bg-background/85 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-walnut shadow-paper">
            {book.era}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display text-lg leading-snug text-obsidian">{book.title}</h3>
          <p className="mt-0.5 font-sans text-xs uppercase tracking-wider text-muted-foreground">
            {book.author} · {book.year}
          </p>
          <p className="mt-3 line-clamp-3 font-serif text-sm italic leading-relaxed text-espresso/80">
            {book.hook}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
