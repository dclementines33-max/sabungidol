// The one button (PRD §9–10): gold for the main action, red for dangerous ones (dark text: cream fails AA).
import type { ComponentProps } from "react";

const VARIANT = {
  primary: "bg-accent-gold text-on-fill",
  danger: "bg-danger text-on-fill",
  secondary: "border border-border-strong text-text-primary hover:bg-surface-hover",
};

export function Button({ variant = "secondary", className = "", type = "button", ...props }: ComponentProps<"button"> & {
  variant?: keyof typeof VARIANT;
}) {
  return (
    <button
      type={type}
      className={`${VARIANT[variant]} inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-gold disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
