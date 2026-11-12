// Form chip (PRD §5.2, §9): fire for On Fire / Hot Streak, ice for Cold Slump; tooltip = last results.
import type { Form, Result } from "@sabung/engine";
import { Flame, Snowflake } from "lucide-react";

const STYLE: Record<Form["name"], { color: string; icon?: typeof Flame }> = {
  "On Fire": { color: "text-accent-coral", icon: Flame },
  "Hot Streak": { color: "text-accent-gold", icon: Flame },
  Confident: { color: "text-accent-sage" },
  Steady: { color: "text-neutral-taupe" },
  "Cold Slump": { color: "text-accent-sky", icon: Snowflake },
};

export function FormBadge({ form, recent = [] }: { form: Form["name"]; recent?: Result[] }) {
  const { color, icon: Icon } = STYLE[form];
  const last = recent.slice(-5);
  const label = last.length ? `${form}, last ${last.length}: ${last.join(" ")}` : form;
  return (
    <span
      className={`${color} inline-flex items-center gap-1 rounded-control border border-border-strong px-2 py-0.5 text-xs`}
      title={label}
      role="img" // a span may not carry a label; as an image the label is read out
      aria-label={label}
    >
      {Icon && <Icon aria-hidden="true" size={14} strokeWidth={1.5} />}
      <span aria-hidden="true">{form}</span>
    </span>
  );
}
