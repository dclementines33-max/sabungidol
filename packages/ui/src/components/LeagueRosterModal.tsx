// Edit one league's roster (PRD §9): exactly 20, no duplicates, warn about idols in another league.
// Paste names to add many at once, or to replace the whole roster; unknown or ambiguous names are listed, never guessed.
import { LEAGUE_SIZE, checkRoster } from "@sabung/shared";
import { TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { IdolPhoto } from "./IdolPhoto";
import { Modal } from "./Modal";
import { SearchableIdolSelect } from "./SearchableIdolSelect";
import { useIdolLookup } from "./idolSource";

export function LeagueRosterModal({ open, onOpenChange, league, roster, idolIds, leagueOf, onApply }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league: string;
  roster: string[];
  idolIds: string[]; // every idol that may be added
  leagueOf: (idolId: string) => string | null;
  onApply: (roster: string[]) => void; // the caller rebuilds fixtures and standings
}) {
  const lookup = useIdolLookup();
  const [draft, setDraft] = useState(roster);
  const [pick, setPick] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [notFound, setNotFound] = useState<string[]>([]);
  const check = checkRoster(draft, league, leagueOf);
  const elsewhere = new Map(check.elsewhere.map((e) => [e.idolId, e.league]));
  const name = (id: string) => lookup(id)?.name ?? id;

  const addPasted = (replace: boolean) => {
    const missing: string[] = [];
    const found: string[] = [];
    for (const line of pasted.split("\n").map((l) => l.trim()).filter(Boolean)) {
      const hits = idolIds.filter((id) => lookup(id)?.name.toLowerCase() === line.toLowerCase());
      if (hits.length === 1) found.push(hits[0]);
      else missing.push(hits.length === 0 ? `${line} — tidak dikenal` : `${line} — ${hits.length} idol bernama sama, pilih lewat pencarian`);
    }
    const base = replace ? [] : draft; // replace = paste a whole new roster, the old one is dropped
    setDraft([...base, ...[...new Set(found)].filter((id) => !base.includes(id))]);
    setNotFound(missing);
    setPasted("");
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={`Roster ${league}`}
      className="max-w-2xl"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Batal</Button>
          <Button variant="primary" disabled={!check.ok} onClick={() => { onApply(draft); onOpenChange(false); }}>Apply</Button>
        </>
      }
    >
      <p className={`m-0 font-mono text-sm tabular-nums ${check.count === LEAGUE_SIZE ? "text-cool" : "text-danger"}`} role="status">
        {check.count} / {LEAGUE_SIZE} idol{check.duplicates.length > 0 && ` · ${check.duplicates.length} ganda`}
      </p>
      <ul className="m-0 mt-2 grid max-h-64 list-none grid-cols-1 gap-1 overflow-auto p-0 sm:grid-cols-2">
        {draft.map((id, i) => (
          <li key={`${id}-${i}`} className="flex items-center gap-2 rounded-control bg-surface px-2 py-1 text-sm">
            <IdolPhoto idolId={id} size={64} className="w-6" />
            <span className="flex-1 truncate">{name(id)}</span>
            {elsewhere.has(id) && (
              <TriangleAlert size={16} strokeWidth={1.5} className="text-accent-bright" aria-label={`juga di ${elsewhere.get(id)}`} />
            )}
            <button
              type="button"
              aria-label={`Hapus ${name(id)} dari ${league}`}
              onClick={() => setDraft(draft.filter((_, j) => j !== i))}
              className="rounded-control p-1 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright"
            >
              <X aria-hidden="true" size={16} strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>
      {check.elsewhere.length > 0 && (
        <p className="m-0 mt-2 text-sm text-accent-bright">
          Juga di liga lain: {check.elsewhere.map((e) => `${name(e.idolId)} (${e.league})`).join(", ")}
        </p>
      )}
      <div className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <SearchableIdolSelect label="Tambah idol" idolIds={idolIds.filter((id) => !draft.includes(id))} value={pick} onChange={setPick} />
        </div>
        <Button disabled={!pick} onClick={() => { if (pick) setDraft([...draft, pick]); setPick(null); }}>Tambah</Button>
      </div>
      <label className="mt-4 block text-sm text-text-secondary">
        Tempel nama, satu per baris
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-text-primary focus-visible:outline-2 focus-visible:outline-accent-bright"
        />
      </label>
      <div className="mt-2 flex gap-2">
        <Button disabled={!pasted.trim()} onClick={() => addPasted(false)}>Tambahkan dari teks</Button>
        <Button disabled={!pasted.trim()} onClick={() => addPasted(true)}>Ganti roster dengan teks</Button>
      </div>
      {notFound.length > 0 && (
        <ul role="alert" className="m-0 mt-2 pl-5 text-sm text-danger">{notFound.map((line) => <li key={line}>{line}</li>)}</ul>
      )}
    </Modal>
  );
}
