// Default Best of N per competition and stage (PRD §4). Settings may override later.
import type { CompetitionCode } from "./competitions";
import type { StageCode } from "./stages";

export type BestOf = 3 | 4 | 5 | 7;

function stagesFor(comp: CompetitionCode): Partial<Record<StageCode, BestOf>> {
  if (comp.startsWith("D1") || comp.startsWith("D2")) return { LG: 4 };
  if (comp.startsWith("BS")) return { KO: 3, FN: 5 };
  switch (comp) {
    case "IDL": return { LG: 4, UB: 5, LB: 5, FN: 7 };
    case "SWS": return { SW: 3 };
    case "LCQ": return { LQ: 3 };
    case "UZC": return { GS: 4, KO: 5, FN: 7 }; // FN covers the 3rd-place match and the final
    case "INK": return { UB: 5, LB: 5, FN: 7 };
    case "NUG": return { KO: 3, FN: 7 };
    case "DSG": return { FN: 7 };
    default: return { FN: 5 }; // MBK
  }
}

export function defaultBestOf(comp: CompetitionCode, stage: StageCode, round?: string): BestOf {
  if (comp === "NUG" && stage === "KO" && round === "SF") return 5;
  const bestOf = stagesFor(comp)[stage];
  if (!bestOf) throw new Error(`${comp} has no stage ${stage}`);
  return bestOf;
}
