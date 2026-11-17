// Warning banner in the panel it concerns (PRD §14.1): stays until the problem is handled.
import type { ReactNode } from "react";
import { LEVEL, type Notice } from "./notice";

export function Banner({ notice, action }: { notice: Notice; action?: ReactNode }) {
  const { color, icon: Icon } = LEVEL[notice.level];
  return (
    <div role="status" className="stage flex flex-wrap items-center gap-3 rounded-[4px] px-4 py-3 text-sm shadow-[inset_4px_0_0_var(--color-accent-bright)]">
      <Icon aria-hidden="true" size={18} strokeWidth={1.5} className={color} />
      <span className="flex-1">{notice.message}</span>
      {action}
    </div>
  );
}
