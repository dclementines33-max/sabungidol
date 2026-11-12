// Settings → Data: the integrity check (PRD §14.2) as a list with "Perbaiki". Safe fixes run in the
// Worker; the others open the screen where they are fixed.
import type { IssueFix } from "@sabung/db";
import { Button } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";

const LINK = "rounded-control px-2 py-1 text-sm text-accent-bright underline underline-offset-4";

export function IntegrityList() {
  const { data: issues, isFetching, refetch } = useQuery({ queryKey: ["integrity"], queryFn: () => engine().integrityCheck() });
  const fix = async (kind: IssueFix) => {
    await engine().fixIntegrity(kind);
    notify({ level: "success", message: "Diperbaiki" });
    await queryClient.invalidateQueries();
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h3 className="m-0 text-sm font-medium">Cek integritas</h3>
        <Button className="px-2 py-1" disabled={isFetching} onClick={() => refetch()}>{isFetching ? "Memeriksa…" : "Periksa lagi"}</Button>
      </div>
      {issues && issues.length === 0 && <p className="m-0 text-sm text-cool">Tidak ada masalah.</p>}
      <ul className="m-0 list-none space-y-2 p-0">
        {issues?.map((issue) => (
          <li key={issue.code} className="flex flex-wrap items-center gap-3 rounded-control border border-border p-2 text-sm">
            <span className={`font-mono ${issue.level === "error" ? "text-danger" : "text-accent-bright"}`}>{issue.code}</span>
            <span className="min-w-0 flex-1">{issue.message}</span>
            {issue.fix === "inactive-manager" && <Link to="/studio/inactive" className={LINK}>Buka Inactive Manager</Link>}
            {issue.fix === "roster-settings" && <a href="#set-roster" className={LINK}>Buka Roster liga</a>}
            {issue.fix && issue.fix.startsWith("remove-") && <Button className="px-2 py-1" onClick={() => fix(issue.fix!)}>Perbaiki</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
