import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, ChevronDown } from "lucide-react";
import {
  generateDossierSection,
  getMentorDossier,
  type DossierSection,
} from "@/server/mentor-dossier";
import { MarkdownProse } from "@/components/markdown-prose";
import { Button } from "@/components/ui/button";

interface SectionDef {
  key: DossierSection;
  label: string;
  icon: string;
  hint: string;
}

const SECTIONS: SectionDef[] = [
  { key: "synopsis",        label: "Synopsis",                    icon: "✦", hint: "What happens, with care for spoilers" },
  { key: "themes",          label: "Themes",                      icon: "❦", hint: "What the book is really about" },
  { key: "characters",      label: "Key Characters",              icon: "♛", hint: "Who matters, and why" },
  { key: "context",         label: "Historical & Literary Context", icon: "⌘", hint: "When it landed and how it was received" },
  { key: "style",           label: "Style & Form",                icon: "✎", hint: "How the prose actually works" },
  { key: "why-it-endures",  label: "Why It Endures",              icon: "✺", hint: "Why we still read it" },
  { key: "how-to-read",     label: "How to Read It",              icon: "❧", hint: "A mentor's preparation" },
  { key: "companions",      label: "Companion Works",             icon: "✤", hint: "What pairs beautifully with it" },
  { key: "content-notes",   label: "Content Notes",               icon: "⚠", hint: "Heads-up before you begin" },
];

interface Props {
  slug: string;
}

export function MentorDossier({ slug }: Props) {
  const [bySection, setBySection] = useState<Partial<Record<DossierSection, string>>>({});
  const [loadingMap, setLoadingMap] = useState<Partial<Record<DossierSection, boolean>>>({});
  const [openMap, setOpenMap] = useState<Partial<Record<DossierSection, boolean>>>({
    synopsis: true,
    themes: true,
  });
  const [bootstrapping, setBootstrapping] = useState(true);

  const generate = useCallback(
    async (section: DossierSection, fresh = false) => {
      setLoadingMap((m) => ({ ...m, [section]: true }));
      try {
        const r = await generateDossierSection({ data: { slug, section, fresh } });
        if (!r.error && r.content) {
          setBySection((s) => ({ ...s, [section]: r.content }));
        }
      } finally {
        setLoadingMap((m) => ({ ...m, [section]: false }));
      }
    },
    [slug],
  );

  // 1. Load cached dossier sections.
  useEffect(() => {
    let active = true;
    setBootstrapping(true);
    getMentorDossier({ data: { slug } })
      .then((r) => {
        if (!active || r.error) return;
        const cached: Partial<Record<DossierSection, string>> = {};
        for (const row of r.sections) {
          cached[row.section as DossierSection] = row.content;
        }
        setBySection(cached);
      })
      .finally(() => active && setBootstrapping(false));
    return () => {
      active = false;
    };
  }, [slug]);

  // 2. Auto-generate the two open sections if not cached. Only after bootstrap finishes.
  useEffect(() => {
    if (bootstrapping) return;
    if (!bySection.synopsis && !loadingMap.synopsis) generate("synopsis");
    if (!bySection.themes && !loadingMap.themes) generate("themes");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapping]);

  const toggle = (section: DossierSection) => {
    setOpenMap((m) => {
      const next = { ...m, [section]: !m[section] };
      // Lazy generation when first opened
      if (next[section] && !bySection[section] && !loadingMap[section]) {
        generate(section);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {SECTIONS.map((s) => {
        const open = !!openMap[s.key];
        const content = bySection[s.key];
        const loading = !!loadingMap[s.key];
        return (
          <article
            key={s.key}
            className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-secondary/30 shadow-paper transition-shadow hover:shadow-leaf"
          >
            <button
              type="button"
              onClick={() => toggle(s.key)}
              aria-expanded={open}
              className="group flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
              <div className="flex min-w-0 items-center gap-4">
                <span
                  aria-hidden
                  className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full border border-gold/30 bg-background/60 font-display text-xl text-gold transition group-hover:border-gold group-hover:text-mahogany"
                >
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg leading-tight text-obsidian sm:text-xl">
                    {s.label}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 font-serif text-xs italic text-espresso/60">
                    {s.hint}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-walnut transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/50 px-6 pb-6 pt-5">
                    {loading && !content ? (
                      <div className="flex items-center gap-2 font-serif text-sm italic text-walnut">
                        <Loader2 className="h-4 w-4 animate-spin" /> The mentor is composing this section…
                      </div>
                    ) : content ? (
                      <>
                        <MarkdownProse content={content} />
                        <button
                          type="button"
                          onClick={() => generate(s.key, true)}
                          disabled={loading}
                          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.2em] text-walnut transition hover:border-gold hover:text-mahogany disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Regenerate
                        </button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => generate(s.key)}>
                        Generate this section
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </article>
        );
      })}
    </div>
  );
}
