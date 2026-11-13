// Season Progression → this season's titles per girl group, as long bars with the champions' names.
import { useIdolLookup } from "@sabung/ui";

export function TitleShare({ titles }: { titles: Record<string, { champion: string } | undefined> }) {
  const lookup = useIdolLookup();
  const by = new Map<string, string[]>();
  for (const t of Object.values(titles)) {
    if (!t) continue;
    const group = lookup(t.champion)?.groupName ?? "Solo";
    by.set(group, [...(by.get(group) ?? []), lookup(t.champion)?.name ?? t.champion]);
  }
  const rows = [...by].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const max = Math.max(1, ...rows.map(([, n]) => n.length));
  if (rows.length === 0) return <p className="m-0 text-sm text-text-secondary">Belum ada gelar season ini.</p>;
  return (
    <ul className="m-0 list-none space-y-3 p-0" aria-label="Gelar per girl group">
      {rows.map(([group, names]) => (
        <li key={group}>
          <p className="m-0 flex items-baseline gap-3"><span className="font-display text-lg">{group}</span><span className="font-gothic text-2xl text-accent-bright">{names.length}</span></p>
          <span aria-hidden="true" className="block h-3 bg-gradient-to-r from-accent to-accent-bright" style={{ width: `${(names.length / max) * 100}%` }} />
          <p className="m-0 mt-1 text-xs text-text-secondary">{[...new Set(names)].join(" · ")}</p>
        </li>
      ))}
    </ul>
  );
}
