// Settings → Backup → Cloud (PRD §12.4): log in (email + password), upload a full .sabung backup, and
// on any device pick one to restore through the usual import preview. Optional: offline or logged out,
// the rest of the app works the same.
import { Button, ConfirmDialog } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { type CloudBackup as Backup, cloudSession, deleteCloudBackup, downloadCloudBackup, listCloudBackups, signIn, signOut, signUp, uploadCloudBackup } from "../../data/cloudApi";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { FIELD } from "./settingsShared";

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
      <label className="text-sm text-text-secondary">Password (min. 8 karakter)<input type="password" required minLength={8} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={FIELD} /></label>
      {error && <p role="alert" className="m-0 text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={busy}>Masuk</Button>
        <Button type="button" disabled={busy || !email || password.length < 8} onClick={go(signUp)}>Daftar akun baru</Button>
      </div>
    </form>
  );
}

export function CloudBackup({ onRestore }: { onRestore: (file: File) => void }) {
  const session = useQuery({ queryKey: ["cloud-session"], queryFn: cloudSession, staleTime: 0, retry: false });
  const user = session.data;
  const backups = useQuery({ queryKey: ["cloud-backups", user?.email], queryFn: listCloudBackups, enabled: !!user, staleTime: 0 });
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Backup | null>(null);

  const upload = async () => {
    setBusy(true);
    try {
      const { bytes, name } = await engine().exportBackup("full");
      await uploadCloudBackup(bytes, name);
      notify({ level: "success", message: `Backup diunggah ke cloud (${mb(bytes.byteLength)})` });
      await backups.refetch();
    } catch (error) {
      fail("Upload backup ke cloud gagal.")(error);
    }
    setBusy(false);
  };
  const remove = (b: Backup) => deleteCloudBackup(b.id).then(() => backups.refetch(), fail("Backup cloud tidak bisa dihapus."));
  const restore = (b: Backup) => downloadCloudBackup(b).then(onRestore, fail("Backup cloud tidak bisa diunduh."));

  return (
    <div className="space-y-3" aria-labelledby="set-cloud">
      <h3 id="set-cloud" className="m-0 text-sm font-medium">Backup cloud (opsional)</h3>
      {session.isPending ? <p className="m-0 text-sm text-text-secondary">Memeriksa login…</p>
        : session.isError ? <p className="m-0 text-sm text-text-secondary">Cloud tidak bisa dihubungi (offline?). Backup lokal di atas tetap bisa dipakai.</p>
        : !user ? <Login onDone={() => void session.refetch()} />
        : (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-text-secondary">Masuk sebagai <span className="text-text-primary">{user.email}</span></span>
              <Button className="px-2 py-1" onClick={() => signOut().then(() => session.refetch(), fail("Keluar gagal."))}>Keluar</Button>
              <Button variant="primary" disabled={busy} onClick={upload}>{busy ? "Mengunggah…" : "Backup ke cloud"}</Button>
            </div>
            {backups.data?.length === 0 ? <p className="m-0 text-sm text-text-secondary">Belum ada backup di cloud.</p> : (
              <ul className="m-0 list-none space-y-1 p-0 text-sm" aria-label="Backup di cloud">
                {backups.data?.map((b) => (
                  <li key={b.id} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate font-mono text-text-secondary">{b.name} · {mb(b.size)} · {new Date(b.createdAt).toLocaleString("id-ID")}</span>
                    <Button className="px-2 py-1" onClick={() => restore(b)}>Pulihkan…</Button>
                    <Button className="px-2 py-1" variant="danger" onClick={() => setDeleting(b)}>Hapus</Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      <ConfirmDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)} danger title="Hapus backup cloud?" confirmLabel="Hapus permanen"
        message={`${deleting?.name ?? ""} dihapus dari cloud dan tidak bisa dikembalikan. Data di perangkat ini tidak berubah.`} onConfirm={() => deleting && void remove(deleting)} />
    </div>
  );
}
