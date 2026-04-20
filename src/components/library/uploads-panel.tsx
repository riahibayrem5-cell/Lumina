import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, FileText, BookOpen, AlertCircle, X, Trash2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  parseUploadedBook,
  listMyUploads,
  getUploadDetail,
  updateUploadChapters,
  deleteUpload,
} from "@/server/uploads";
import { extractPdfTextInBrowser } from "@/lib/pdf-extract";

interface UploadRow {
  id: string;
  title: string;
  author: string | null;
  format: string;
  status: string;
  total_chapters: number | null;
  error_message: string | null;
  file_size_bytes: number | null;
  created_at: string;
}

export function UploadsPanel() {
  const { session } = useAuth();
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const r = await listMyUploads();
    if (!r.error) setUploads(r.uploads as UploadRow[]);
    setLoading(false);
  };

  useEffect(() => {
    if (session) refresh();
  }, [session]);

  // Auto-poll uploads that are still parsing
  useEffect(() => {
    const hasParsing = uploads.some((u) => u.status === "parsing");
    if (!hasParsing) return;
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [uploads]);

  return (
    <div className="space-y-8">
      <UploadDropzone onUploaded={refresh} />

      <div>
        <h3 className="mb-4 font-display text-xl text-obsidian">Your uploads</h3>

        {loading && uploads.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-walnut">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : uploads.length === 0 ? (
          <p className="font-serif italic text-espresso/70">
            No uploads yet. Drop a PDF or EPUB above to begin.
          </p>
        ) : (
          <div className="space-y-3">
            {uploads.map((u) => (
              <UploadRow
                key={u.id}
                upload={u}
                onReview={() => setReviewId(u.id)}
                onDeleted={refresh}
              />
            ))}
          </div>
        )}
      </div>

      {reviewId && (
        <ChapterReviewModal
          uploadId={reviewId}
          onClose={() => setReviewId(null)}
          onSaved={() => {
            setReviewId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function UploadDropzone({ onUploaded }: { onUploaded: () => void }) {
  const { session } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !session) return;
    const file = files[0];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "epub") {
      toast.error("Only PDF and EPUB files are supported.");
      return;
    }
    setBusy(true);
    try {
      let extractedText: string | undefined;

      if (ext === "pdf") {
        setProgress("Reading PDF…");
        extractedText = await extractPdfTextInBrowser(file, (pct) =>
          setProgress(`Extracting text… ${pct}%`),
        );
        if (!extractedText || extractedText.trim().length < 200) {
          throw new Error(
            "Couldn't extract text from this PDF. It may be a scanned image — text-based PDFs only for now.",
          );
        }
      }

      setProgress("Uploading…");
      const filePath = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("user-books").upload(filePath, file, {
        contentType: file.type || (ext === "pdf" ? "application/pdf" : "application/epub+zip"),
      });
      if (up.error) throw new Error(up.error.message);

      setProgress("Detecting chapters…");
      const parsed = await parseUploadedBook({
        data: {
          filePath,
          format: ext as "pdf" | "epub",
          fileName: file.name,
          fileSize: file.size,
          extractedText,
        },
      });
      if (!parsed.ok) throw new Error(parsed.error ?? "Parsing failed");

      toast.success(`Parsed ${parsed.totalChapters} chapter${parsed.totalChapters === 1 ? "" : "s"}.`);
      onUploaded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!busy) handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragOver
          ? "border-gold bg-gold/5"
          : "border-border bg-card/40 hover:border-walnut/60"
      } ${busy ? "opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.epub,application/pdf,application/epub+zip"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary text-walnut">
        {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-xl text-obsidian">
        {busy ? progress || "Working…" : "Upload a PDF or EPUB"}
      </h3>
      <p className="mt-2 font-serif italic text-espresso/70">
        {busy
          ? "Please don't close this tab — large books may take a moment."
          : "Drop a file here, or click to browse. Stays private to your library."}
      </p>
      {!busy && (
        <Button
          variant="outline"
          className="mt-5"
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
      )}
    </div>
  );
}

function UploadRow({
  upload,
  onReview,
  onDeleted,
}: {
  upload: UploadRow;
  onReview: () => void;
  onDeleted: () => void;
}) {
  const handleDelete = async () => {
    if (!confirm(`Remove "${upload.title}" from your library? The original file will also be deleted.`))
      return;
    await deleteUpload({ data: { uploadId: upload.id } });
    onDeleted();
  };

  const sizeStr = upload.file_size_bytes
    ? `${(upload.file_size_bytes / (1024 * 1024)).toFixed(1)} MB`
    : "";

  const slug = `upload-${upload.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-paper"
    >
      <div className="grid h-12 w-12 place-items-center rounded-lg bg-secondary text-walnut">
        <FileText className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-lg text-obsidian">{upload.title}</p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {upload.author ? `${upload.author} · ` : ""}
          {upload.format.toUpperCase()} {sizeStr && `· ${sizeStr}`}{" "}
          {upload.total_chapters ? `· ${upload.total_chapters} chapters` : ""}
        </p>
        {upload.status === "parsing" && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-walnut">
            <Loader2 className="h-3 w-3 animate-spin" /> Parsing…
          </p>
        )}
        {upload.status === "error" && (
          <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-px h-3 w-3 flex-shrink-0" /> {upload.error_message}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {upload.status === "ready" && (
          <>
            <Button variant="ghost" size="sm" onClick={onReview}>
              Edit chapters
            </Button>
            <Link to="/read/$bookId/$chapter" params={{ bookId: slug, chapter: "0" }}>
              <Button size="sm">
                <BookOpen className="mr-2 h-3 w-3" /> Read
              </Button>
            </Link>
          </>
        )}
        <Button variant="ghost" size="icon" onClick={handleDelete} aria-label="Delete upload">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  );
}

interface ChapterEditState {
  title: string;
  text: string;
}

function ChapterReviewModal({
  uploadId,
  onClose,
  onSaved,
}: {
  uploadId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [chapters, setChapters] = useState<ChapterEditState[]>([]);

  useEffect(() => {
    let active = true;
    getUploadDetail({ data: { uploadId } }).then((r) => {
      if (!active) return;
      if (r.upload) {
        const u = r.upload as unknown as {
          title: string;
          author: string | null;
          chapters: ChapterEditState[] | null;
        };
        setTitle(u.title);
        setAuthor(u.author ?? "");
        setChapters(Array.isArray(u.chapters) ? u.chapters : []);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [uploadId]);

  const updateChapter = (i: number, patch: Partial<ChapterEditState>) => {
    setChapters((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const removeChapter = (i: number) => {
    setChapters((prev) => prev.filter((_, idx) => idx !== i));
  };

  const mergeWithNext = (i: number) => {
    setChapters((prev) => {
      if (i >= prev.length - 1) return prev;
      const merged = {
        title: prev[i].title,
        text: prev[i].text + "\n\n" + prev[i + 1].text,
      };
      return [...prev.slice(0, i), merged, ...prev.slice(i + 2)];
    });
  };

  const save = async () => {
    if (chapters.length === 0) {
      toast.error("Keep at least one chapter.");
      return;
    }
    setSaving(true);
    const r = await updateUploadChapters({
      data: { uploadId, title, author, chapters },
    });
    setSaving(false);
    if (r.ok) {
      toast.success("Chapters saved.");
      onSaved();
    } else {
      toast.error(r.error ?? "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-obsidian/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-background shadow-tome">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-2xl text-obsidian">Review chapters</h3>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="grid h-40 place-items-center text-walnut">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="up-title">Title</Label>
                <Input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="up-author">Author</Label>
                <Input id="up-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </div>
            </div>

            <div>
              <p className="mb-2 font-sans text-xs uppercase tracking-wider text-walnut">
                {chapters.length} chapter{chapters.length === 1 ? "" : "s"} detected — edit titles or merge as needed
              </p>
              <div className="space-y-3">
                {chapters.map((c, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs text-muted-foreground">{i + 1}.</span>
                      <Input
                        value={c.title}
                        onChange={(e) => updateChapter(i, { title: e.target.value })}
                        className="flex-1"
                      />
                      {i < chapters.length - 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => mergeWithNext(i)}
                          title="Merge into next"
                        >
                          + Merge
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeChapter(i)}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={c.text.slice(0, 600) + (c.text.length > 600 ? "…" : "")}
                      readOnly
                      rows={3}
                      className="mt-2 resize-none bg-background font-serif text-xs text-espresso/70"
                    />
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {c.text.split(/\s+/).length.toLocaleString()} words
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
