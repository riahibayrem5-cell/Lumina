import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ReadingStatus = "reading" | "completed" | "to-read" | "paused";

export interface Highlight {
  id: string;
  bookId: string;
  chapter: number;
  text: string;
  note?: string;
  createdAt: number;
}

export interface BookProgress {
  bookId: string;
  chapter: number;
  scrollRatio: number;
  status: ReadingStatus;
  totalChapters?: number;
  startedAt: number;
  updatedAt: number;
}

interface ReadingState {
  progress: Record<string, BookProgress>;
  highlights: Highlight[];
  settings: {
    fontSize: number; // 16–24
    lineHeight: number; // 1.5–2
    contrast: "soft" | "normal" | "strong";
  };
  setProgress: (bookId: string, patch: Partial<BookProgress>) => void;
  addHighlight: (h: Highlight) => void;
  removeHighlight: (id: string) => void;
  setStatus: (bookId: string, status: ReadingStatus) => void;
  setSettings: (patch: Partial<ReadingState["settings"]>) => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set) => ({
      progress: {},
      highlights: [],
      settings: { fontSize: 18, lineHeight: 1.75, contrast: "normal" },

      setProgress: (bookId, patch) =>
        set((state) => {
          const prev = state.progress[bookId];
          const base: BookProgress = prev ?? {
            bookId,
            chapter: 0,
            scrollRatio: 0,
            status: "reading",
            startedAt: Date.now(),
            updatedAt: Date.now(),
          };
          const next: BookProgress = { ...base, ...patch, bookId, updatedAt: Date.now() };
          return { progress: { ...state.progress, [bookId]: next } };
        }),

      addHighlight: (h) => set((s) => ({ highlights: [h, ...s.highlights].slice(0, 500) })),
      removeHighlight: (id) => set((s) => ({ highlights: s.highlights.filter((h) => h.id !== id) })),

      setStatus: (bookId, status) =>
        set((state) => {
          const prev = state.progress[bookId];
          if (!prev) {
            return {
              progress: {
                ...state.progress,
                [bookId]: {
                  bookId,
                  chapter: 0,
                  scrollRatio: 0,
                  status,
                  startedAt: Date.now(),
                  updatedAt: Date.now(),
                },
              },
            };
          }
          return {
            progress: {
              ...state.progress,
              [bookId]: { ...prev, status, updatedAt: Date.now() },
            },
          };
        }),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: "lumina-reading-v1" },
  ),
);
