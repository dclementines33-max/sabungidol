// Idol Profile in the menu (Update 2): opens the profile of the highest-rated active idol; its hero has a picker to
// switch to anyone else.
import { useQuery } from "@tanstack/react-query";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";

export const Route = createFileRoute("/wiki/profile")({ component: ProfileEntry });

function ProfileEntry() {
  const { data: idols } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  if (!idols) return <p className="text-text-secondary">Loading database…</p>;
  const top = [...idols].filter((i) => i.active).sort((a, b) => b.rating - a.rating)[0] ?? idols[0];
  return top ? <Navigate to="/wiki/idols/$id" params={{ id: top.id }} replace /> : <p className="text-text-secondary">No idols yet.</p>;
}
