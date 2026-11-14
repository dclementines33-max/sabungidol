// What a panel shows in Fase 1, before the phase that builds it (agreed shell, step 7).
import { EmptyState } from "@sabung/ui";
import { Link, useLocation } from "@tanstack/react-router";
import { panelFor } from "./shell/nav";

export function PanelPlaceholder() {
  const { pathname } = useLocation();
  const panel = panelFor(pathname);
  if (!panel) return null;
  return (
    <EmptyState
      icon={panel.icon}
      title={panel.label}
      description={`This panel arrives in phase ${panel.phase}.`}
      action={pathname !== "/studio/input" && panel.phase > 2
        ? <Link to="/studio/input" className="text-sm text-accent-bright underline underline-offset-4">Start with Input Data</Link>
        : undefined}
    />
  );
}
