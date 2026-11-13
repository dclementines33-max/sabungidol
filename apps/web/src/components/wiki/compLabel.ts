// How a career-stats competition key reads ("ALL" = every competition together).
import { SEASON_COMPETITIONS } from "@sabung/shared";

export const compLabel = (key: string) => (key === "ALL" ? "Combined" : SEASON_COMPETITIONS.find((c) => c.key === key)?.name ?? key);
