// The Idols "Sync rating" (Update 4): re-pick the 20 by today's ratings, shown as who comes in and who goes out,
// behind a confirmation. Only until The Idols' first match (user decision); after that the button says why not.
import { Button, ConfirmDialog, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";

export function SyncTheIdols({ disabled }: { disabled: boolean }) {
  const lookup = useIdolLookup();
  const [confirm, setConfirm] = useState(false);
  const { data: changes } = useQuery({ queryKey: [...SEASON_QUERY, "the-idols-sync"], queryFn: () => engine().theIdolsChanges(), staleTime: 0 });
  if (!changes) return null;
  const names = (ids: string[]) => ids.map((id) => lookup(id)?.name ?? id).join(", ");
  const count = changes.in.length;
  const sync = async () => {
    const result = await engine().syncTheIdols();
    notify(result.ok ? { level: "success", message: `Roster The Idols disesuaikan: ${count} masuk, ${count} keluar` } : { level: "warning", message: result.reason! });
    await queryClient.invalidateQueries({ queryKey: SEASON_QUERY });
  };
  return (
    <>
      <Button disabled={disabled || changes.played || count === 0} onClick={() => setConfirm(true)}
        title={changes.played ? "Match The Idols sudah dimainkan" : count === 0 ? "Roster sudah sesuai rating" : undefined}>
        Sync rating{count ? ` (${count} berubah)` : ""}
      </Button>
      {changes.played && <span className="text-xs text-text-secondary">Roster terkunci: match The Idols sudah dimainkan</span>}
      {confirm && (
        <ConfirmDialog open onOpenChange={setConfirm} title="Sync rating The Idols"
          message={`Masuk: ${names(changes.in)}. Keluar: ${names(changes.out)}.`} confirmLabel="Sync" onConfirm={sync} />
      )}
    </>
  );
}
