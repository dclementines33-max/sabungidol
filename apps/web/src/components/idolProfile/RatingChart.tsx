// Rating history as a small line (PRD §8 Idol Profile Overview): the first old rating, then every saved change.
export function RatingChart({ history, current }: { history: { old: number; new: number }[]; current: number }) {
  const points = history.length ? [history[0]!.old, ...history.map((h) => h.new)] : [current];
  if (points.length < 2) return <p className="m-0 text-sm text-text-secondary">Rating belum pernah berubah ({current}).</p>;
  const lo = Math.min(...points) - 2;
  const hi = Math.max(...points) + 2;
  const x = (i: number) => (i / (points.length - 1)) * 300;
  const y = (r: number) => 80 - ((r - lo) / (hi - lo)) * 80;
  return (
    <svg viewBox="-4 -4 308 88" className="h-28 w-full max-w-lg" role="img" aria-label={`Riwayat rating: ${points.join(" → ")}`}>
      <polyline points={points.map((r, i) => `${x(i)},${y(r)}`).join(" ")} fill="none" stroke="var(--color-accent-bright)" strokeWidth="2" />
      {points.map((r, i) => <circle key={i} cx={x(i)} cy={y(r)} r="3" fill="var(--color-accent-bright)" />)}
    </svg>
  );
}
