// Starting over with an empty database, only when the user confirms it (user decision 2026-11-13).
// Why: if a fresh install is interrupted in its first seconds, PGlite's OPFS storage stays broken
// for good (E-DB-001 on every open). An automatic clean-up deleted a real database once (3f02beb),
// so nothing is deleted without the user, and never a database that has ever opened:
// - the Worker writes "<name>.ready" after every successful open;
// - the reset is only offered when opening fails and "<name>.ready" is missing;
// - the user's yes leaves "<name>.reset"; the Worker deletes, before opening and holding the lock,
//   only when that request is there AND "<name>.ready" is still missing.
type Dir = Pick<FileSystemDirectoryHandle, "getFileHandle" | "removeEntry">;

const has = (root: Dir, file: string) => root.getFileHandle(file).then(() => true, () => false);

export const markOpened = (root: Dir, name: string) => root.getFileHandle(`${name}.ready`, { create: true });

export const neverOpened = async (root: Dir, name: string) => !(await has(root, `${name}.ready`));

export const requestReset = (root: Dir, name: string) => root.getFileHandle(`${name}.reset`, { create: true });

// The old page's Worker can still hold the files for a moment after it lets go of the lock.
async function removeWhenFree(root: Dir, entry: string, waitMs: number) {
  for (const until = Date.now() + waitMs; ;) {
    try {
      return await root.removeEntry(entry, { recursive: true });
    } catch (error) {
      if ((error as DOMException).name === "NotFoundError") return;
      if (Date.now() > until) throw error;
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

// In the Worker, holding the lock, before opening. Returns whether it reset.
export async function resetIfRequested(root: Dir, name: string, waitMs = 5000): Promise<boolean> {
  if (!(await has(root, `${name}.reset`))) return false;
  if (await has(root, `${name}.ready`)) { // it has opened since: never delete it
    await root.removeEntry(`${name}.reset`);
    return false;
  }
  await removeWhenFree(root, name, waitMs);
  await removeWhenFree(root, `${name}-photos`, waitMs);
  await root.removeEntry(`${name}.reset`);
  return true;
}
