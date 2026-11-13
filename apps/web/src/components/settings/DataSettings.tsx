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
      notify({ level: "success", message: `Statistik dibangun ulang dari ${seasons} season` });
    } catch (error) {
      notify({ level: "error", code: "E-STATS-001", message: "Rebuild Stats gagal. Match tidak berubah.", context: error instanceof Error ? error.message : String(error) });
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
      <h2 id="set-data" className="m-0 font-display text-lg">Data</h2>
      {data && (
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
          <dt className="text-text-secondary">Penyimpanan</dt><dd className="m-0">{data.storage === "opfs" ? "OPFS (cepat)" : "IndexedDB (lambat)"}</dd>
          <dt className="text-text-secondary">Terpakai</dt><dd className="m-0 font-mono">{mb(data.estimate?.usage)} dari {mb(data.estimate?.quota)}</dd>
          <dt className="text-text-secondary">Penyimpanan permanen</dt><dd className="m-0">{data.persisted ? "Diizinkan" : "Belum diizinkan: buat backup rutin"}</dd>
          <dt className="text-text-secondary">Match tersimpan</dt><dd className="m-0 font-mono">{data.matches}</dd>
        </dl>
      )}
      <Button disabled={rebuilding} onClick={rebuild}>{rebuilding ? "Membangun ulang…" : "Rebuild Stats"}</Button>
      <IntegrityList />
    </section>
  );
}
