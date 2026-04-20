// Client-side PDF text extraction using pdfjs-dist.
// Runs in the browser only — pdfjs needs Worker/DOM APIs that aren't available
// in the Cloudflare Worker runtime where server functions execute.

interface PdfTextItem {
  str?: string;
  hasEOL?: boolean;
  transform?: number[];
}

let workerConfigured = false;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  if (!workerConfigured) {
    // Use a worker URL that Vite can resolve at build time.
    const workerUrl = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    workerConfigured = true;
  }
  return pdfjs;
}

export async function extractPdfTextInBrowser(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buf) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as PdfTextItem[];
    let pageText = "";
    let lastY: number | null = null;
    for (const it of items) {
      const str = it.str ?? "";
      const y = it.transform?.[5] ?? null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        pageText += "\n";
      }
      pageText += str;
      if (it.hasEOL) pageText += "\n";
      lastY = y;
    }
    pages.push(pageText);
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }
  return pages.join("\n\n");
}
