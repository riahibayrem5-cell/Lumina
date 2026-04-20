// Chapter title normalization — used by upload parser, EPUB extractor,
// reader header, and mentor library to keep chapter titles clean and consistent.

const ROMAN_MAP: Record<string, number> = {
  I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
};

/** Convert a Roman numeral string to an integer. Returns null if invalid. */
export function romanToInt(roman: string): number | null {
  const s = roman.toUpperCase().trim();
  if (!s || !/^[IVXLCDM]+$/.test(s)) return null;
  let total = 0;
  let prev = 0;
  for (let i = s.length - 1; i >= 0; i--) {
    const v = ROMAN_MAP[s[i]];
    if (!v) return null;
    if (v < prev) total -= v;
    else total += v;
    prev = v;
  }
  return total > 0 && total < 5000 ? total : null;
}

/** Title-case a string while preserving small connector words. */
function smartTitleCase(input: string): string {
  const small = new Set([
    "a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on",
    "or", "the", "to", "vs", "via", "with",
  ]);
  return input
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part, i, arr) => {
      if (/^\s+$/.test(part) || part === "-") return part;
      const isFirst = i === 0;
      const isLast = i === arr.length - 1;
      if (!isFirst && !isLast && small.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

const GENERIC_TITLE = /^(?:chapter|section|part|book|prologue|epilogue|interlude)(?:\s|$)/i;

/**
 * Clean a raw chapter heading.
 *
 * - "CHAPTER IV. THE GHOST" → "Chapter 4 — The Ghost"
 * - "Chapter 1: The Beginning" → "Chapter 1 — The Beginning"
 * - "CHAPTER 5" → "Chapter 5"
 * - "THE BONE-PILE" → "The Bone-Pile"
 * - empty/garbage → fallback
 */
export function cleanChapterTitle(raw: string, indexFromZero?: number): string {
  if (!raw) {
    return indexFromZero !== undefined ? `Chapter ${indexFromZero + 1}` : "Chapter";
  }
  let s = raw
    .replace(/\s+/g, " ")
    .replace(/^[\s\-—_*•·]+|[\s\-—_*•·]+$/g, "")
    .trim();

  if (!s) {
    return indexFromZero !== undefined ? `Chapter ${indexFromZero + 1}` : "Chapter";
  }

  // Match leading "CHAPTER X" (Arabic OR Roman) optionally followed by
  // a separator and the rest of the title.
  const m = s.match(
    /^(chapter|section|part|book)\s+([ivxlcdm]+|\d+)\s*[:.\-—–]?\s*(.*)$/i,
  );
  if (m) {
    const word = m[1].toLowerCase();
    const numRaw = m[2];
    const rest = m[3].trim();
    const arabic = /^\d+$/.test(numRaw)
      ? parseInt(numRaw, 10)
      : romanToInt(numRaw);
    const num = arabic ?? numRaw;
    const cleanWord = word.charAt(0).toUpperCase() + word.slice(1);
    if (rest && rest.length > 1) {
      const restClean = isAllCaps(rest) ? smartTitleCase(rest) : rest;
      return `${cleanWord} ${num} — ${restClean}`;
    }
    return `${cleanWord} ${num}`;
  }

  // Bare Roman numeral like "IV." or "V"
  if (/^[ivxlcdm]+\.?$/i.test(s)) {
    const n = romanToInt(s.replace(/\.$/, ""));
    if (n) return `Chapter ${n}`;
  }

  // Bare number
  if (/^\d+\.?$/.test(s)) {
    return `Chapter ${parseInt(s, 10)}`;
  }

  if (isAllCaps(s)) s = smartTitleCase(s);

  // Cap length so it doesn't blow out UI
  if (s.length > 120) s = s.slice(0, 117).trimEnd() + "…";

  return s;
}

function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 4) return false;
  return letters === letters.toUpperCase();
}

/** True if a heading looks like the generic auto-generated fallback. */
export function isGenericChapterTitle(s: string): boolean {
  return !s || GENERIC_TITLE.test(s.trim());
}
