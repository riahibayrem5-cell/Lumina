import { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function AudioTab() {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState([0]);
  const [speed, setSpeed] = useState([1]);
  const [voice, setVoice] = useState<"british-male" | "british-female">("british-female");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-card to-secondary/40 p-5">
        <p className="font-serif text-sm italic leading-relaxed text-espresso/80">
          <strong className="not-italic font-display text-mahogany">Coming soon.</strong> ElevenLabs narration
          unlocks once an API key is added. The controls below preview the experience.
        </p>
      </div>

      <div className="space-y-2">
        <label className="font-sans text-xs uppercase tracking-wider text-walnut">Voice</label>
        <div className="flex gap-2">
          {[
            { id: "british-female", label: "British · Female" },
            { id: "british-male", label: "British · Male" },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setVoice(v.id as typeof voice)}
              className={`flex-1 rounded-lg border px-3 py-2 font-sans text-xs uppercase tracking-wider transition ${
                voice === v.id
                  ? "border-walnut bg-walnut text-ivory"
                  : "border-border bg-background text-espresso/70 hover:border-gold"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Waveform placeholder */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex h-16 items-center gap-0.5">
          {Array.from({ length: 60 }).map((_, i) => {
            const h = 20 + Math.abs(Math.sin(i * 0.7)) * 60 + (i % 7) * 4;
            const past = i / 60 < progress[0] / 100;
            return (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-colors ${past ? "bg-walnut" : "bg-taupe/40"}`}
                style={{ height: `${Math.min(100, h)}%` }}
              />
            );
          })}
        </div>
      </div>

      <Slider value={progress} onValueChange={setProgress} max={100} step={1} aria-label="Playback position" />

      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" disabled>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button onClick={() => setPlaying((p) => !p)} size="icon" className="h-12 w-12 rounded-full">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" disabled>
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-walnut">
          <Volume2 className="h-3 w-3" /> Speed · {speed[0].toFixed(2)}×
        </label>
        <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2} step={0.05} />
      </div>
    </div>
  );
}
