// Idols or girl groups: the two-way switch at the top of Ranking and Tier List (skewed chips, the active one lit).
import { Users, UsersRound } from "@sabung/ui/icons";
import type { Kind } from "../data/userLists";

const OPTIONS = [{ id: "idol", label: "Idols", Icon: Users }, { id: "group", label: "Girl groups", Icon: UsersRound }] as const;

export function KindSwitch({ value, onChange }: { value: Kind; onChange: (kind: Kind) => void }) {
  return (
    <div role="group" aria-label="Rank" className="inline-flex gap-1">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}
          className={`chip py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright ${value === id ? "bg-accent text-on-accent shadow-[0_8px_24px_-10px_var(--color-accent-bright)]" : "bg-stage-hi text-text-secondary hover:text-text-primary"}`}
        >
          <span className="inline-flex items-center gap-2"><Icon size={16} strokeWidth={1.75} />{label}</span>
        </button>
      ))}
    </div>
  );
}
