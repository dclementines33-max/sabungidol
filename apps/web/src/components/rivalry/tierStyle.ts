// Each rivalry tier's colour (a token) and how many flames its heat earns (1–5).
import type { RivalryTier } from "@sabung/engine";

export const TIER_COLOR: Record<RivalryTier, string> = {
  eternal: "var(--color-winner)", feud: "var(--color-accent-bright)", rising: "var(--color-tier-s)", nemesis: "var(--color-brand-violet)",
};
export const flames = (heat: number) => Math.max(1, Math.min(5, Math.round(heat / 4)));
