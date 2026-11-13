// The one button (PRD §9–10). Redesign brief: filled, never outlined; capitals in the wide sans. Crimson with a
// glow for the main action, a dark red fill for the rest, a red tint for dangerous ones.
import type { ComponentProps } from "react";

const VARIANT = {
  primary: "bg-accent text-on-accent shadow-[0_10px_30px_-10px_rgb(255_77_99/0.55)] hover:brightness-125",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
  secondary: "bg-surface-hover/70 text-text-primary hover:bg-surface-hover",
};

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT;
}) {
  return (
    <button
      type={type}
      className={`${VARIANT[variant]} inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-xs font-bold tracking-[0.12em] uppercase [font-stretch:115%] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
