// Arena stats read in the Worker (2026-11-18), one entry for every screen: the Arenas page (usage, honours, each arena's
// best idols; all time or one season), an idol's record per arena, and a pair's meetings per arena.
import { type Db, listArenaMatches } from "@sabung/db";
import { type WDL, arenaHonours, arenaUsage, idolArenaRecords, played, winPct } from "@sabung/engine";

export type ArenaLine = WDL & { arena: string };
const byPlayed = (x: WDL, y: WDL) => played(y) - played(x) || y.w - x.w;

async function overview(db: Db, seasonId?: string) {
  const rows = await listArenaMatches(db, { seasonId });
  const leaders: Record<string, (WDL & { idol: string })[]> = {};
  for (const [idol, arenas] of idolArenaRecords(rows)) for (const [arena, r] of arenas) (leaders[arena] ??= []).push({ idol, ...r });
  for (const list of Object.values(leaders)) list.sort((x, y) => y.w - x.w || winPct(y) - winPct(x) || x.idol.localeCompare(y.idol)).splice(10);
  return { matches: rows.length, usage: Object.fromEntries(arenaUsage(rows)), honours: arenaHonours(rows), leaders };
}

async function idol(db: Db, idolId: string): Promise<ArenaLine[]> {
  const mine = idolArenaRecords(await listArenaMatches(db, { idolId })).get(idolId) ?? new Map();
  return [...mine].map(([arena, r]) => ({ arena, ...r })).sort(byPlayed);
}

async function pair(db: Db, a: string, b: string): Promise<ArenaLine[]> {
  const rows = (await listArenaMatches(db, { idolId: a })).filter((m) => m.idolA === b || m.idolB === b);
  return [...(idolArenaRecords(rows).get(a) ?? new Map())].map(([arena, r]) => ({ arena, ...r })).sort(byPlayed);
}

const READS = { overview, idol, pair };
type Reads = typeof READS;
export type ArenaRead = keyof Reads;
export type ArenaArgs<K extends ArenaRead> = Parameters<Reads[K]> extends [Db, ...infer R] ? R : never;
export type ArenaResult<K extends ArenaRead> = Awaited<ReturnType<Reads[K]>>;

// Untyped across the Worker line (Comlink loses the generic); useArenaRead types both ends.
export function arenaRead(db: Db, kind: ArenaRead, args: unknown[]): Promise<unknown> {
  return (READS[kind] as (db: Db, ...rest: unknown[]) => Promise<unknown>)(db, ...args);
}
