// Play / pause, replay from matchday 1, and a scrubber to any matchday (2026-11-17). Shared by every replayable chart.
import { Button } from "@sabung/ui";
import type { useReplay } from "./useReplay";

export function ReplayControls({ r, label }: { r: ReturnType<typeof useReplay>; label: string }) {
  if (r.total < 2) return null;
  return (
    <div role="group" aria-label={`${label} replay`} className="flex flex-wrap items-center gap-3">
      <Button onClick={r.toggle}>{r.playing ? "Pause" : "Play"}</Button>
      <Button onClick={r.replay}>Replay</Button>
      <label className="flex min-w-48 flex-1 items-center gap-3 text-sm text-text-secondary">
        <span className="font-mono tabular-nums whitespace-nowrap">Matchday {r.day} / {r.total}</span>
        <input type="range" min={1} max={r.total} value={r.day} onChange={(e) => r.seek(Number(e.target.value))} aria-label={`${label} matchday`} className="flex-1 accent-[var(--color-accent-bright)]" />
      </label>
    </div>
  );
}
