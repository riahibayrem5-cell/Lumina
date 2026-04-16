import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export function MarkdownProse({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("font-serif text-espresso leading-relaxed", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 font-display text-3xl text-obsidian first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 font-display text-xl text-walnut first:mt-0 border-b border-border/60 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 font-display text-base text-mahogany">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-4 leading-[1.75]">{children}</p>,
          ul: ({ children }) => <ul className="mb-4 ml-5 list-disc space-y-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-4 ml-5 list-decimal space-y-1.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          em: ({ children }) => <em className="italic text-mahogany">{children}</em>,
          strong: ({ children }) => <strong className="font-semibold text-obsidian">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-gold pl-4 italic text-espresso/80">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-secondary px-1 py-0.5 font-mono text-sm">{children}</code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
