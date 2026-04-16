import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Library, Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-paper transition-transform group-hover:-rotate-3">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-obsidian">
            Lumina <span className="text-walnut">Books</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-mahogany" }}
            className="rounded-md px-3 py-2 font-medium text-espresso/70 transition-colors hover:bg-secondary/60 hover:text-mahogany"
          >
            <span className="hidden sm:inline">Discover</span>
            <Sparkles className="h-4 w-4 sm:hidden" />
          </Link>
          <Link
            to="/library"
            activeProps={{ className: "bg-secondary text-mahogany" }}
            className="rounded-md px-3 py-2 font-medium text-espresso/70 transition-colors hover:bg-secondary/60 hover:text-mahogany"
          >
            <span className="hidden sm:inline">My Library</span>
            <Library className="h-4 w-4 sm:hidden" />
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
