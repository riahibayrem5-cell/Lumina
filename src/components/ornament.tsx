// Decorative ornament — small flourish used between sections / above headings.
// Pure SVG, theme-aware via currentColor.

interface Props {
  className?: string;
  variant?: "fleuron" | "rule" | "diamond";
}

export function Ornament({ className = "", variant = "fleuron" }: Props) {
  if (variant === "rule") {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center gap-3 text-gold/60 ${className}`}
      >
        <span className="h-px flex-1 max-w-[6rem] bg-gradient-to-r from-transparent via-current to-current" />
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-gold">
          <path
            d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
        <span className="h-px flex-1 max-w-[6rem] bg-gradient-to-l from-transparent via-current to-current" />
      </div>
    );
  }
  if (variant === "diamond") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 24 8"
        className={`h-2 w-6 text-gold ${className}`}
        fill="currentColor"
      >
        <path d="M4 4 L6 1 L8 4 L6 7 Z" />
        <path d="M11 4 L13 1 L15 4 L13 7 Z" opacity="0.6" />
        <path d="M18 4 L20 1 L22 4 L20 7 Z" opacity="0.3" />
      </svg>
    );
  }
  // fleuron — flourish ornament with curls
  return (
    <svg
      aria-hidden
      viewBox="0 0 80 24"
      className={`h-6 w-20 text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    >
      <path d="M2 12 Q 18 12 24 6 Q 30 0 36 12 Q 40 20 44 12 Q 50 0 56 6 Q 62 12 78 12" />
      <circle cx="40" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="2" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="78" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
