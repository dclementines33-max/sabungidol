// Error panel (PRD §14.1–14.2): what failed, where, and what next, with a report the user can copy.
import { useState } from "react";
import { Button } from "./Button";
import { LEVEL } from "./notice";

export function ErrorPanel({ code, message, context, report, onRetry, retryLabel = "Reload panel" }: {
  code: string;
  message: string;
  context?: string;
  report: string; // full text for "Salin laporan": code, stack, version, route, last action
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const Icon = LEVEL.error.icon;
  return (
    <div role="alert" className="rounded-card bg-danger/10 bg-surface p-4">
      <p className="m-0 flex items-center gap-2 font-mono text-sm text-danger">
        <Icon aria-hidden="true" size={18} strokeWidth={1.5} />
        {code}
      </p>
      <p className="m-0 mt-2">{message}</p>
      {context && <p className="m-0 mt-1 text-sm text-text-secondary">{context}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry && <Button variant="primary" onClick={onRetry}>{retryLabel}</Button>}
        <Button
          onClick={async () => {
            await navigator.clipboard.writeText(report);
            setCopied(true);
          }}
        >
          {copied ? "Report copied" : "Copy report"}
        </Button>
      </div>
    </div>
  );
}
