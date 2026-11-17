// The one button (PRD §9–10). Redesign brief: filled, never outlined; capitals in the wide sans. Design round 2 (Fight
// Night): a skewed face like a fight-card ticket (the label is skewed back, so text stays upright); the main action is a
// crimson-to-bright gradient with a glow, the rest a dark stage face with a rim light, dangerous ones a red tint.
import type { ComponentProps } from "react";

const VARIANT = {
  primary: "bg-[linear-gradient(100deg,var(--color-accent),color-mix(in_oklab,var(--color-accent-bright)_30%,var(--color-accent)))] text-on-accent shadow-[0_10px_30px_-10px_var(--color-accent-bright)] hover:brightness-125",
  danger: "bg-danger/15 text-danger shadow-[inset_0_-2px_0_var(--color-danger)] hover:bg-danger/25",
  secondary: "bg-stage-hi text-text-primary shadow-[inset_0_1px_0_rgb(185_211_226/0.12),inset_0_-2px_0_color-mix(in_oklab,var(--color-accent-bright)_45%,transparent)] hover:bg-surface-hover",
};

export function Button({ variant = "secondary", className = "", type = "button", children, ...props }: ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT;
}) {
  return (
    <button
      type={type}
      className={`${VARIANT[variant]} inline-flex -skew-x-12 items-center justify-center rounded-[3px] px-4 py-2 text-xs font-bold tracking-[0.12em] uppercase transition-[filter,background-color] [font-stretch:115%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      <span className="inline-flex skew-x-12 items-center gap-2">{children}</span>
    </button>
  );
}
