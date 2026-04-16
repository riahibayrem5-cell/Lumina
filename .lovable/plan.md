

# Lumina Books — V1 Plan

A premium AI-powered literary companion. V1 ships a polished vertical slice: a stunning landing page, a full-featured reader with all 5 AI tabs working on real classics, and a local library. Everything else from the spec is deferred.

## Design system

**Aesthetic**: Modern Dark Academia / Minimalist Library — calm, tactile, expensive-feeling.

- **Palette**: Ivory `#F9F7F2` bg · Warm Beige `#E1D7C6` cards · Soft Taupe `#C9B8A3` dividers · Walnut `#5C4033` primary · Mahogany `#3E2723` hover · Charcoal Espresso `#2D2424` text · Deep Obsidian `#1A1515` headers · Aged Gold `#D4AF37`, Sage `#87A878`, Dusty Rose `#B87D8B` accents
- **Type**: Playfair Display (headings) · Lora (long-form reading) · Inter (UI)
- **Motion**: Framer Motion — soft fades, staggered card reveals, hover lifts, smooth panel transitions
- **Texture**: Subtle paper-grain SVG overlay, layered soft shadows, 8–16px radii, Aged Gold focus rings

## V1 scope

### 1. Landing (`/`)
- Full-viewport hero, fading serif headline "Rediscover the Classics."
- Command-K style search with autocomplete over the curated library
- "Featured Literature" grid — book cards with cover, title, author, AI hook line
- Genre / era / mood chip filters scrolling into "Explore"

### 2. Reader (`/read/$bookId/$chapter`) — the centerpiece
Split-pane responsive (right panel collapses to bottom sheet on mobile).

**Left — E-Reader**
- Lora typography, ~70ch line length, generous spacing
- Chapter dropdown, progress bar, text-size / contrast / spacing controls
- Sentence selection → floating tooltip with AI micro-analysis + "Save highlight"
- Auto-save scroll position every 5s to localStorage

**Right — AI Companion (tabs)**
- **Summary** — streaming long-form scholarly analysis (Narrative · Characters · Themes · Context · Devices · Discussion)
- **Visuals** — Nano Banana 2 chapter illustrations with style presets (Vintage Oil, Cinematic Noir, Watercolor, Woodcut)
- **Mentor** — pre-reading context, historical background, symbolism, vocabulary
- **Ask the Book** — RAG-style chat, chapter-scoped, citations, tone selector
- **Audio** — placeholder UI with controls + waveform (real TTS deferred until ElevenLabs key)

### 3. Library (`/library`)
- Saved books grid with status badges (Reading / Completed / To Read)
- Progress rings, "Continue Reading" carousel
- Local-only via IndexedDB + localStorage

### Content
- Curated seed of ~12 public-domain classics (Frankenstein, Pride & Prejudice, Dorian Gray, Dracula, Sherlock, Gatsby, Jane Eyre, Moby Dick excerpts, etc.)
- Server function fetches & caches plain text from Project Gutenberg on demand, splits into chapters
- Covers from Open Library; AI-generated vintage fallback via Nano Banana 2

## Architecture (adapted to project stack)

- **TanStack Start + React 19 + Vite + Tailwind v4** (not Next.js — adapted from spec)
- **Routing**: file-based in `src/routes/` — separate route per page (no hash anchors)
- **State**: Zustand for reader/AI session state · TanStack Query for AI caching
- **AI layer**: server functions in `src/server/ai/` calling Lovable AI Gateway (Gemini/GPT-5) and Nano Banana 2 — no API keys needed, free tier included
- **Persistence**: IndexedDB (book text cache, AI responses) + localStorage (reading progress, highlights, settings)
- **Components**: Radix primitives + custom (BookCard, SearchCommand, ProgressRing, AIChat, HighlightTooltip, AudioPlayerShell, ReaderControls)
- **A11y**: WCAG 2.1 AA — contrast verified, keyboard nav, ARIA, reduced-motion respect
- **Perf**: Code splitting per route, virtualized long chapters, streaming AI responses, skeleton loaders

## Explicitly deferred (next passes)
Character map (React Flow), Challenges, Trivia, Literary Bingo, character chat personas, achievements, community/sharing, ambient sounds, real ElevenLabs audio, accounts/cloud sync, export to PDF/Markdown.

