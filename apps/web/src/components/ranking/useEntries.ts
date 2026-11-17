// What Ranking and Tier List can rank, per kind: every idol (highest rating first) or every girl group that has members
// (A–Z; taken from the idol rows, which carry each group's name and logo), with a name, a second line and, for a group, its logo and the member whose photo stands for it.
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import type { Kind } from "../../data/userLists";

export type Entry = { id: string; name: string; sub: string; face: string | null; logoId: string | null; rating: number; groupId: string | null };
const on = typeof Worker !== "undefined";

export function useEntries(kind: Kind) {
  const { data: idols } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: on });
  return useMemo(() => {
    if (!idols) return null;
    const groups = new Map(idols.flatMap((i) => (i.groupId ? [[i.groupId, { id: i.groupId, name: i.groupName ?? i.groupId, logoId: i.groupLogoId }] as const] : [])));
    const list: Entry[] = kind === "idol"
      ? [...idols].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name))
        .map((i) => ({ id: i.id, name: i.name, sub: i.groupName ?? "Soloist", face: i.id, logoId: i.groupLogoId, rating: i.rating, groupId: i.groupId }))
      : [...groups.values()].flatMap((g) => {
        const members = idols.filter((i) => i.groupId === g.id).sort((a, b) => b.rating - a.rating);
        if (!members.length) return [];
        const avg = Math.round(members.reduce((n, m) => n + m.rating, 0) / members.length);
        return [{ id: g.id, name: g.name, sub: `${members.length} member${members.length === 1 ? "" : "s"} · avg ${avg}`, face: members[0]!.id, logoId: g.logoId, rating: avg, groupId: g.id }];
      }).sort((a, b) => a.name.localeCompare(b.name));
    return { list, byId: new Map(list.map((e) => [e.id, e])) };
  }, [idols, kind]);
}
