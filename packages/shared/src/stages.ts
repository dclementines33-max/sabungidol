// Stage codes used inside match ids (PRD §3). LG, GS and KO come from the PRD examples.
export const STAGE_CODES = {
  LG: "league",
  SW: "swiss",
  LQ: "lcq",
  GS: "group",
  KO: "knockout",
  UB: "playoff-ub",
  LB: "playoff-lb",
  FN: "final",
} as const;

export type StageCode = keyof typeof STAGE_CODES;

export function isStageCode(code: string): code is StageCode {
  return code in STAGE_CODES;
}
