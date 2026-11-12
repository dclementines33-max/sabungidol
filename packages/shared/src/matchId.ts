// The one place that builds and reads match ids: S{season}-{COMP}-{STAGE}-{ROUND}-M{slot} (PRD §3).
import { type CompetitionCode, isCompetitionCode } from "./competitions";
import { type StageCode, isStageCode } from "./stages";

export type MatchIdParts = {
  season: number;
  comp: CompetitionCode;
  stage: StageCode;
  round: string; // may contain dashes, e.g. "C-MD2" = group C, matchday 2
  slot: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

export function buildMatchId(p: MatchIdParts): string {
  return `S${pad(p.season)}-${p.comp}-${p.stage}-${p.round}-M${pad(p.slot)}`;
}

export function classifyMatch(id: string): MatchIdParts {
  const parts = id.split("-");
  const [season, comp, stage] = parts;
  const slot = parts.at(-1) ?? "";
  const round = parts.slice(3, -1).join("-");
  if (parts.length < 5 || !/^S\d+$/.test(season) || !/^M\d+$/.test(slot)) throw new Error(`Bad match id: ${id}`);
  if (!isCompetitionCode(comp)) throw new Error(`Unknown competition in match id: ${id}`);
  if (!isStageCode(stage)) throw new Error(`Unknown stage in match id: ${id}`);
  return { season: Number(season.slice(1)), comp, stage, round, slot: Number(slot.slice(1)) };
}
