// PGlite's OPFS storage cannot recover when its very first creation is interrupted (a reload or a
// closed tab in the first seconds): it never refills the file pool Postgres needs, so every later
// open fails with E-DB-001. A marker file says "first creation in progress"; if it is still there
// on the next start, nothing was ever saved, so the half-made database is cleared and made again.
// A database without the marker (finished, or made before this fix) is never touched.
type Dir = Pick<FileSystemDirectoryHandle, "getFileHandle" | "getDirectoryHandle" | "removeEntry">;

const exists = (find: Promise<unknown>) => find.then(() => true, () => false);

// After a reload the old page's Worker closes its files a moment after it lets go of the lock,
// so removing can be refused for a short while: try again until it works.
async function removeWhenFree(root: Dir, name: string, waitMs: number) {
  for (const until = Date.now() + waitMs; ;) {
    try {
      return await root.removeEntry(name, { recursive: true });
    } catch (error) {
      if ((error as DOMException).name === "NotFoundError") return; // already gone
      if (Date.now() > until) throw error;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

export async function openFirstTimeSafely<T>(root: Dir, name: string, open: () => Promise<T>, waitMs = 5000): Promise<T> {
  const marker = `${name}.creating`;
  if (await exists(root.getFileHandle(marker))) await removeWhenFree(root, name, waitMs);
  else if (await exists(root.getDirectoryHandle(name))) return open();
  await root.getFileHandle(marker, { create: true });
  const db = await open();
  await root.removeEntry(marker);
  return db;
}
