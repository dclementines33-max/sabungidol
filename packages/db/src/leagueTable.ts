// League totals per idol, counted in SQL straight from the matches table (PRD §12.1: the table is
// never stored, always computed). Tie-break order is the engine's job (computeStandings).
import { sql } from "drizzle-orm";
import type { Db } from "./openDb";

export type LeagueTotals = {
  idolId: string; played: number; wins: number; draws: number; losses: number;
  points: number; gamesWon: number; gamesLost: number;
};

export async function leagueTotals(db: Db, seasonId: string, comp: string): Promise<LeagueTotals[]> {
  const { rows } = await db.execute<LeagueTotals>(sql`
    with sides as (
      select idol_a as idol, score_a as won, score_b as lost, case result when 'A' then 'W' when 'D' then 'D' else 'L' end as outcome
      from matches where season_id = ${seasonId} and comp = ${comp} and stage = 'LG'
      union all
      select idol_b, score_b, score_a, case result when 'B' then 'W' when 'D' then 'D' else 'L' end
      from matches where season_id = ${seasonId} and comp = ${comp} and stage = 'LG'
    )
    select idol as "idolId",
      count(*)::int as played,
      count(*) filter (where outcome = 'W')::int as wins,
      count(*) filter (where outcome = 'D')::int as draws,
      count(*) filter (where outcome = 'L')::int as losses,
      (3 * count(*) filter (where outcome = 'W') + count(*) filter (where outcome = 'D'))::int as points,
      sum(won)::int as "gamesWon",
      sum(lost)::int as "gamesLost"
    from sides group by idol order by idol`);
  return rows;
}
