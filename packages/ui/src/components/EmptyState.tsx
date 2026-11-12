// What a panel shows when it has nothing yet, and what to do next (PRD §9 proposal).
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <Icon aria-hidden="true" size={48} strokeWidth={1.5} className="text-text-secondary" />
      <p className="m-0 mt-2 font-display text-lg">{title}</p>
      {description && <p className="m-0 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
