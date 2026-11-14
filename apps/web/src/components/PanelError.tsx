// When one panel crashes (PRD §14.2): only that panel is replaced by this card; the shell keeps working.
// The error goes to the bell history and event_log; "Reload panel" tries the panel again.
import { ErrorPanel } from "@sabung/ui";
import { type ErrorComponentProps, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { errorReport } from "../data/errorReport";
import { useNotices } from "../data/notices";

export const PANEL_ERROR_CODE = "E-PANEL-001";

export function PanelError({ error, reset }: ErrorComponentProps) {
  // The route where it failed, fixed at the moment of failure: while the user navigates away this card
  // renders once more with the new path, which must not be logged as a second failure.
  const [route] = useState(useLocation().pathname);
  const router = useRouter();
  const record = useNotices((s) => s.record);
  const message = error instanceof Error ? error.message : String(error);
  const report = useMemo(() => errorReport({ code: PANEL_ERROR_CODE, error, route }), [error, route]);
  useEffect(() => {
    record({ level: "error", code: PANEL_ERROR_CODE, message: `Panel ${route} failed to load`, context: message });
  }, [message, route, record]);
  return (
    <div className="mx-auto max-w-xl py-8">
      <ErrorPanel
        code={PANEL_ERROR_CODE}
        message="This panel failed to load"
        context={message}
        report={report}
        retryLabel="Reload panel"
        onRetry={() => {
          reset();
          router.invalidate();
        }}
      />
    </div>
  );
}
