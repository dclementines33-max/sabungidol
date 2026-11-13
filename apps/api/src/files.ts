// Where the .sabung files live: a private Supabase Storage bucket, reached with the service key (the
// browser never sees it). Tests use an in-memory map with the same three calls.
export type Files = {
  put(path: string, body: ArrayBuffer): Promise<void>;
  get(path: string): Promise<ArrayBuffer | null>;
  remove(path: string): Promise<void>;
};

export function supabaseFiles(url: string, serviceKey: string, bucket = "backups"): Files {
  const object = (path: string) => `${url}/storage/v1/object/${bucket}/${path}`;
  const headers = { authorization: `Bearer ${serviceKey}`, apikey: serviceKey };
  const ok = async (res: Response) => {
    if (!res.ok) throw new Error(`Storage ${res.status}: ${await res.text()}`);
  };
  return {
    put: async (path, body) => ok(await fetch(object(path), { method: "POST", headers: { ...headers, "content-type": "application/octet-stream", "x-upsert": "true" }, body })),
    get: async (path) => {
      const res = await fetch(object(path), { headers });
      if (res.status === 400 || res.status === 404) return null; // Supabase answers 400 for a missing object
      await ok(res);
      return res.arrayBuffer();
    },
    remove: async (path) => ok(await fetch(`${url}/storage/v1/object/${bucket}`, { method: "DELETE", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ prefixes: [path] }) })),
  };
}

export function memoryFiles(): Files {
  const store = new Map<string, ArrayBuffer>();
  return {
    put: async (path, body) => void store.set(path, body),
    get: async (path) => store.get(path) ?? null,
    remove: async (path) => void store.delete(path),
  };
}
