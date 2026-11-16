// Settings → Backup → Cloud (PRD §12.4): log in (email + password), upload a .sabung backup (default: base data), and
// on any device pick one to restore through the usual import preview. Optional: offline or logged out,
// the rest of the app works the same.
import { type BackupSection, SECTION_LABELS } from "@sabung/shared";
import { Button, ConfirmDialog } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type CloudBackup as Backup, cloudSession, deleteCloudBackup, downloadCloudBackup, listCloudBackups, signIn, signOut, signUp, uploadCloudBackup } from "../../data/cloudApi";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { FIELD } from "./settingsShared";

// The file name carries the section ("sabung-base-2026-11-16.sabung").
const sectionOf = (name: string) => SECTION_LABELS[name.split("-")[1] as BackupSection]?.split(" (")[0] ?? "Backup";
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;
const fail = (message: string) => (error: unknown) => notify({ level: "error", code: "E-CLOUD-001", message, context: error instanceof Error ? error.message : String(error) });

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const go = (action: typeof signIn) => async () => {
    setBusy(true);
    setError("");
    await action(email, password).then(onDone, (e: Error) => setError(e.message));
    setBusy(false);
  };
  return (
    <form className="grid max-w-sm gap-3" onSubmit={(e) => { e.preventDefault(); void go(signIn)(); }}>
      <label className="text-sm text-text-secondary">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} /></label>
      <label className="text-sm text-text-secondary">Password (min. 8 characters)<input type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={FIELD} /></label>
      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={busy}>Sign in</Button>
        <Button type="button" disabled={busy || !email || password.length < 8} onClick={go(signUp)}>Create account</Button>
      </div>
    </form>
  );
}

export function CloudBackup({ seasonId, onRestore }: { seasonId: string; onRestore: (file: File) => void }) {
  const [section, setSection] = useState<BackupSection>("base");
  const session = useQuery({ queryKey: ["cloud-session"], queryFn: cloudSession, staleTime: 0, retry: false });
  const user = session.data;
  const backups = useQuery({ queryKey: ["cloud-backups", user?.email], queryFn: listCloudBackups, enabled: !!user, staleTime: 0 });
  const [busy, setBusy] = useState("");
  const [deleting, setDeleting] = useState<Backup | null>(null);

  const upload = async () => {
    setBusy("Preparing backup…");
    try {
      const { bytes, name } = await engine().exportBackup(section, section === "season" || section === "base" ? seasonId : undefined);
      setBusy(`Uploading ${mb(bytes.byteLength)}…`);
      await uploadCloudBackup(bytes, name);
      notify({ level: "success", message: `Backup uploaded to the cloud (${mb(bytes.byteLength)})` });
      await backups.refetch();
    } catch (error) {
      fail("Cloud upload failed.")(error);
    }
    setBusy("");
  };
  const remove = (b: Backup) => deleteCloudBackup(b.id).then(() => backups.refetch(), fail("The cloud backup couldn't be deleted."));
  const restore = (b: Backup) => downloadCloudBackup(b).then(onRestore, fail("The cloud backup couldn't be downloaded."));

  return (
    <div className="space-y-3" aria-labelledby="set-cloud">
      <h3 id="set-cloud" className="m-0 text-sm font-medium">Cloud backup (optional)</h3>
      {session.isPending ? <p className="m-0 text-sm text-text-secondary">Checking sign-in…</p>
        : session.isError ? <p className="m-0 text-sm text-text-secondary">Can't reach the cloud (offline?). The local backup above still works.</p>
        : !user ? <Login onDone={() => void session.refetch()} />
        : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-text-secondary">Signed in as <span className="text-text-primary">{user.email}</span></span>
              <Button className="px-2 py-1" onClick={() => signOut().then(() => session.refetch(), fail("Sign-out failed."))}>Sign out</Button>
              <select aria-label="Cloud backup type" value={section} onChange={(e) => setSection(e.target.value as BackupSection)} className="rounded-none border-0 border-b-2 border-border-strong bg-surface/70 px-2 py-2 text-text-primary">
                {Object.entries(SECTION_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <Button variant="primary" disabled={!!busy} onClick={upload}>{busy || "Back up to cloud"}</Button>
            </div>
            {backups.data?.length === 0 ? <p className="m-0 text-sm text-text-secondary">No cloud backups yet.</p> : (
              <ul className="m-0 list-none space-y-1 p-0 text-sm" aria-label="Cloud backups">
                {backups.data?.map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate font-mono text-text-secondary">{sectionOf(b.name)} · {b.name} · {mb(b.size)} · {new Date(b.createdAt).toLocaleString("en-GB")}</span>
                    <Button className="px-2 py-1" onClick={() => restore(b)}>Restore…</Button>
                    <Button className="px-2 py-1" variant="danger" onClick={() => setDeleting(b)}>Delete</Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} danger title="Delete cloud backup?" confirmLabel="Delete for good"
        message={`${deleting?.name ?? ""} is deleted from the cloud for good. Data on this device doesn't change.`} onConfirm={() => deleting && void remove(deleting)} />
    </div>
  );
}
