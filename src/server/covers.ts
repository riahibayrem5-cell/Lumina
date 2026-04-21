// Cover resolver — Open Library by ISBN/title, then Google Books fallback.
// Returns a stable HTTPS URL or null. Designed to be cheap and parallel.

const TIMEOUT_MS = 4000;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "LuminaBooks/1.0 (cover-resolver)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function headOk(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return false;
    // Open Library returns a tiny 1×1 transparent gif when no cover.
    const len = parseInt(res.headers.get("content-length") ?? "0", 10);
    if (len > 0 && len < 2000) return false;
    return true;
  } catch {
    return false;
  }
}

/** Try Open Library by ISBN. Verified by HEAD. */
export async function coverFromOpenLibraryIsbn(isbn: string): Promise<string | null> {
  const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-L.jpg`;
  return (await headOk(url)) ? url : null;
}

interface OpenLibrarySearchResult {
  docs?: Array<{ cover_i?: number; isbn?: string[] }>;
}

/** Try Open Library by title + author search → first cover_i hit. */
export async function coverFromOpenLibrarySearch(title: string, author: string): Promise<string | null> {
  const q = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=3`;
  const data = await fetchJson<OpenLibrarySearchResult>(q);
  const docs = data?.docs ?? [];
  for (const d of docs) {
    if (d.cover_i) {
      const url = `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`;
      if (await headOk(url)) return url;
    }
  }
  return null;
}

interface GoogleBooksResult {
  items?: Array<{
    volumeInfo?: { imageLinks?: { thumbnail?: string; smallThumbnail?: string } };
  }>;
}

/** Google Books fallback. Upgrades to https + zoom=1 for crisper image. */
export async function coverFromGoogleBooks(title: string, author: string): Promise<string | null> {
  const q = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(`intitle:${title} inauthor:${author}`)}&maxResults=3`;
  const data = await fetchJson<GoogleBooksResult>(q);
  const items = data?.items ?? [];
  for (const it of items) {
    const thumb = it.volumeInfo?.imageLinks?.thumbnail ?? it.volumeInfo?.imageLinks?.smallThumbnail;
    if (thumb) {
      const upgraded = thumb
        .replace(/^http:/, "https:")
        .replace(/&edge=curl/g, "")
        .replace(/zoom=\d/, "zoom=1");
      return upgraded;
    }
  }
  return null;
}

/**
 * Resolve the best available cover for a book.
 * Tries: (1) Open Library by ISBN, (2) Open Library search, (3) Google Books.
 * Returns null only if everything fails.
 */
export async function resolveCover(opts: {
  title: string;
  author: string;
  isbn?: string | null;
}): Promise<string | null> {
  if (opts.isbn) {
    const olIsbn = await coverFromOpenLibraryIsbn(opts.isbn);
    if (olIsbn) return olIsbn;
  }
  const olSearch = await coverFromOpenLibrarySearch(opts.title, opts.author);
  if (olSearch) return olSearch;
  const gb = await coverFromGoogleBooks(opts.title, opts.author);
  return gb;
}
