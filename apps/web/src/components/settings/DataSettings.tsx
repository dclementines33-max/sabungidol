// Settings → Data (PRD §8, §12, §7): where the data lives, how much space it takes, the integrity check,
// and Rebuild Stats (career stats and placements built again from the matches).
import { Button } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { IntegrityList } from "./IntegrityList";
import { SECTION } from "./settingsShared";

const mb = (bytes = 0) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function DataSettings() {
  const [rebuilding, setRebuilding] = useState(false);
  const rebuild = async () => {
    setRebuilding(true);
    try {
      const seasons = await engine().rebuildStats();
      notify({ level: "success", message: `Statistics rebuilt from ${seasons} seasons` });
    } catch (error) {
      notify({ level: "error", code: "E-STATS-001", message: "Rebuild Stats failed. Matches unchanged.", context: error instanceof Error ? error.message : String(error) });
    } finally { setRebuilding(false); }
  };
  const { data } = useQuery({
    queryKey: ["storage-usage"],
    queryFn: async () => {
      const [estimate, persisted, storage, matches] = await Promise.all([
        navigator.storage?.estimate?.() ?? Promise.resolve(undefined),
        navigator.storage?.persisted?.() ?? Promise.resolve(false),
        engine().storage(),
        engine().matchCount(),
      ]);
      return { estimate, persisted, storage, matches };
    },
  });
  return (
    <section className={SECTION} aria-labelledby="set-data">
      <h2 id="set-data" className="m-0 font-display">Data</h2>
      {data && (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-text-secondary">Storage</dt><dd className="m-0">{data.storage === "opfs" ? "OPFS (fast)" : "IndexedDB (slow)"}</dd>
          <dt className="text-text-secondary">Used</dt><dd className="m-0 font-mono">{mb(data.estimate?.usage)} of {mb(data.estimate?.quota)}</dd>
          <dt className="text-text-secondary">Persistent storage</dt><dd className="m-0">{data.persisted ? "Allowed" : "Not allowed yet: back up regularly"}</dd>
          <dt className="text-text-secondary">Matches saved</dt><dd className="m-0 font-mono">{data.matches}</dd>
        </dl>
      )}
      <Button disabled={rebuilding} onClick={rebuild}>{rebuilding ? "Rebuilding…" : "Rebuild Stats"}</Button>
      <IntegrityList />
    </section>
  );
}
