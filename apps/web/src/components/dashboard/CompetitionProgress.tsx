// Progress per competition (PRD §8 Dashboard): each competition's status and matches played this season.
const STATUS = { off: "Off", none: "Next season", waiting: "Waiting", next: "Ready", running: "Live", finished: "Done" } as const;

export function CompetitionProgress({ competitions }: { competitions: { key: string; name: string; played: number; status: keyof typeof STATUS }[] }) {
  if (!competitions.length) return <p className="m-0 text-sm text-text-secondary">The season hasn't started.</p>;
  return (
    <ul className="m-0 list-none space-y-1 p-0 text-sm">
      {competitions.map((c) => (
        <li key={c.key} className="flex gap-2">
          <span className="flex-1">{c.name}</span>
          <span className="font-mono text-text-secondary tabular-nums">{c.played}</span>
          <span className={`w-20 text-right ${c.status === "finished" ? "text-text-primary" : c.status === "running" ? "text-accent-bright" : "text-text-secondary"}`}>{STATUS[c.status]}</span>
        </li>
      ))}
    </ul>
  );
}
