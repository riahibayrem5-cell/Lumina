import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getBookBySlug } from "@/server/books";
import { MentorTab } from "@/components/reader/mentor-tab";

export const Route = createFileRoute("/book/$slug")({
  loader: async ({ params }) => {
    const res = await getBookBySlug({ data: { slug: params.slug } });
    if (!res.book) throw notFound();
    return { book: res.book };
  },
  head: ({ loaderData }) => {
    const b = loaderData?.book;
    const title = b ? `${b.title} by ${b.author} — Lumina Books` : "Book — Lumina Books";
    const desc = b?.description ?? `Read about ${b?.title ?? "this book"} with an AI literary companion.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(b?.cover_url ? [
          { property: "og:image", content: b.cover_url },
          { name: "twitter:image", content: b.cover_url },
        ] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <h1 className="font-display text-3xl">Book not found</h1>
        <Link to="/" className="mt-4 inline-block text-walnut underline">
          Return to the library
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center">
      <div className="text-center">
        <p className="font-serif italic text-espresso">{error.message}</p>
        <Link to="/" className="mt-4 inline-block text-walnut underline">Go home</Link>
      </div>
    </div>
  ),
  component: BookPage,
});

function BookPage() {
  const { book } = Route.useLoaderData();
  const canRead = book.source === "gutenberg" && !!book.gutenberg_id;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-10 sm:grid-cols-[220px_1fr]"
        >
          <div>
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={`${book.title} cover`}
                className="aspect-[2/3] w-full rounded-lg border border-border object-cover shadow-tome"
              />
            ) : (
              <div className="grid aspect-[2/3] w-full place-items-center rounded-lg border border-dashed border-border bg-card/50 text-walnut">
                <BookOpen className="h-8 w-8" />
              </div>
            )}
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.35em] text-walnut">
              {book.era ?? "Literature"}
              {book.year ? ` · ${book.year}` : ""}
            </p>
            <h1 className="mt-3 font-display text-4xl text-obsidian sm:text-5xl">{book.title}</h1>
            <p className="mt-2 font-serif text-lg italic text-espresso/80">by {book.author}</p>

            {book.description && (
              <p className="mt-6 max-w-prose font-serif leading-relaxed text-espresso">
                {book.description}
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {canRead ? (
                <Link
                  to="/read/$bookId/$chapter"
                  params={{ bookId: book.slug, chapter: "0" }}
                >
                  <Button size="lg">
                    <BookOpen className="mr-2 h-4 w-4" /> Begin reading
                  </Button>
                </Link>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-gold" />
                  <div>
                    <p className="font-display text-sm text-obsidian">Full text not freely available.</p>
                    <p className="mt-1 font-serif italic text-espresso/70">
                      We can still prepare a mentor guide, historical context, and discussion below.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <section className="mt-16 border-t border-border/60 pt-10">
          <div className="mb-6 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="font-display text-2xl text-obsidian">Mentor Guide</h2>
          </div>
          <div className="rounded-xl border border-border bg-card/40 p-6">
            <MentorTab bookId={book.slug} chapter={0} />
          </div>
        </section>
      </div>
    </div>
  );
}
