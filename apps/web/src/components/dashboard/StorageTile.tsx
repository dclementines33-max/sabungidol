// Dashboard → Data: how much of the browser's storage quota this app uses (navigator.storage.estimate), as "used X of Y"
// with a bar; over 80% a warning says what to do before saving fails (W-STORAGE-003 is the notice once it does).
const WARN_AT = 0.8;
const size = (bytes: number) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`);

export function StorageTile({ usage, quota }: { usage?: number; quota?: number }) {
  const share = usage !== undefined && quota ? Math.min(1, usage / quota) : null;
  const full = share !== null && share > WARN_AT;
  return (
    <dl className="m-0 panel bg-surface p-4">
      <dt className="text-sm text-text-secondary">Storage</dt>
      <dd className="m-0 mt-1">
        <span className="font-mono text-2xl tabular-nums">{usage !== undefined ? size(usage) : "–"}</span>
        {quota ? <span className="text-sm text-text-secondary"> used of {size(quota)}</span> : null}
        {share !== null && (
          <span role="meter" aria-label="Storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)} className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-hover">
            <span className={`block h-full ${full ? "bg-danger" : "bg-accent-bright"}`} style={{ width: `${Math.max(share * 100, 1)}%` }} />
          </span>
        )}
        {full && <span role="status" className="mt-2 block text-sm text-danger">Storage almost full ({Math.round(share * 100)}%). Back up, then delete old seasons or photos.</span>}
      </dd>
    </dl>
  );
}
