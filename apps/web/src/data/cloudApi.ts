// Talks to the cloud backup API (apps/api) on the app's own domain; the session is a cookie.
// Every call can fail offline: callers show that, and the rest of the app never needs the cloud.
export type CloudUser = { email: string };
export type CloudBackup = { id: string; name: string; size: number; createdAt: string };

async function call(path: string, init?: RequestInit) {
  const res = await fetch(`/api/${path}`, init);
  if (res.ok) return res;
  const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null; // ours: error; Better Auth: message
  throw new Error(body?.error ?? body?.message ?? `HTTP ${res.status}`);
}
const post = (path: string, body: unknown) => call(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export const cloudSession = async (): Promise<CloudUser | null> => ((await (await call("auth/get-session")).json()) as { user: CloudUser } | null)?.user ?? null;
export const signIn = (email: string, password: string) => post("auth/sign-in/email", { email, password });
export const signUp = (email: string, password: string) => post("auth/sign-up/email", { email, password, name: email });
export const signOut = () => post("auth/sign-out", {});

export const listCloudBackups = async () => (await (await call("backups")).json()) as CloudBackup[];
export const uploadCloudBackup = (bytes: Uint8Array, name: string) => call(`backups?name=${encodeURIComponent(name)}`, { method: "POST", body: bytes as BodyInit });
export const downloadCloudBackup = async (b: CloudBackup) => new File([await (await call(`backups/${b.id}`)).arrayBuffer()], b.name);
export const deleteCloudBackup = (id: string) => call(`backups/${id}`, { method: "DELETE" });
