import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownProse } from "@/components/markdown-prose";
import { askTheBook } from "@/server/ai";

type Tone = "scholarly" | "casual" | "socratic";
type Msg = { role: "user" | "assistant"; content: string };

const TONES: { id: Tone; label: string }[] = [
  { id: "scholarly", label: "Scholarly" },
  { id: "casual", label: "Casual" },
  { id: "socratic", label: "Socratic" },
];

const SUGGESTIONS = [
  "What's the central tension of this chapter?",
  "Explain a symbol I might miss.",
  "What does the narrator's tone reveal?",
];

export function ChatTab({ bookId, chapter }: { bookId: string; chapter: number }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<Tone>("scholarly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await askTheBook({ data: { slug: bookId, chapter, tone, messages: next } });
      if (res.error) {
        setError(res.error);
        setMessages(messages); // rollback
      } else {
        setMessages([...next, { role: "assistant", content: res.reply }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[60vh] flex-col">
      <div className="mb-3 flex flex-wrap gap-2">
        {TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={`rounded-full border px-3 py-1 font-sans text-xs uppercase tracking-wider transition ${
              tone === t.id
                ? "border-walnut bg-walnut text-ivory"
                : "border-border bg-background text-espresso/70 hover:border-gold"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-6">
            <p className="mb-4 font-serif italic text-espresso/70">
              Ask the book anything — grounded in this chapter.
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-left font-serif text-sm italic text-espresso/80 transition hover:border-gold hover:text-mahogany"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-6 rounded-lg bg-walnut px-4 py-3 text-ivory"
                : "rounded-lg border border-border bg-card px-4 py-3"
            }
          >
            {m.role === "user" ? (
              <p className="font-sans text-sm leading-relaxed">{m.content}</p>
            ) : (
              <MarkdownProse content={m.content} className="text-sm" />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-walnut">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the page…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm font-serif italic">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Ask about this chapter…"
          rows={2}
          className="flex-1 resize-none font-serif"
        />
        <Button type="submit" disabled={loading || !input.trim()} size="icon" className="self-end">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
