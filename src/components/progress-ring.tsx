interface Props {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
}

export function ProgressRing({ value, size = 56, stroke = 5, label }: Props) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      aria-label={label ? `${label}: ${Math.round(v * 100)}%` : `${Math.round(v * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-taupe)" strokeWidth={stroke} fill="none" opacity={0.4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-walnut)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <span className="absolute font-display text-xs font-semibold text-walnut">
        {Math.round(v * 100)}%
      </span>
    </div>
  );
}
