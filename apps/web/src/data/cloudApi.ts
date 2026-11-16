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
// In parts of 20 MB (the cloud stores at most 50 MB per object), each tried up to 3 times, then recorded as one backup.
const PART = 20 * 1024 * 1024;
async function tries<T>(work: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work();
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}
export async function uploadCloudBackup(bytes: Uint8Array, name: string, progress?: (sent: number, total: number) => void) {
  const upload = crypto.randomUUID();
  const parts = Math.max(1, Math.ceil(bytes.byteLength / PART));
  for (let i = 0; i < parts; i++) {
    const body = bytes.subarray(i * PART, (i + 1) * PART);
    await tries(() => call(`backups/upload/${upload}/${i}`, { method: "PUT", body: body as BodyInit }));
    progress?.(Math.min((i + 1) * PART, bytes.byteLength), bytes.byteLength);
  }
  return call(`backups/upload/${upload}?name=${encodeURIComponent(name)}&parts=${parts}&size=${bytes.byteLength}`, { method: "POST" });
}
export const downloadCloudBackup = async (b: CloudBackup) => new File([await (await call(`backups/${b.id}`)).arrayBuffer()], b.name);
export const deleteCloudBackup = (id: string) => call(`backups/${id}`, { method: "DELETE" });
