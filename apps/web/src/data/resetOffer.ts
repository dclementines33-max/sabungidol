// Whether to offer "start over with an empty database" (see databaseReset.ts for the safety rules),
// and what the user's confirmed yes does: leave a reset request and reload, so the Worker deletes
// the broken database before it opens anything.
import { create } from "zustand";
import { neverOpened, requestReset } from "./databaseReset";

export const useResetOffer = create<{ database: string | null }>(() => ({ database: null }));

// After the database failed to open: offer the reset only for an OPFS database that never opened.
export async function offerResetIfNeverOpened(database: string): Promise<void> {
  if (typeof navigator.storage?.getDirectory !== "function") return;
  const root = await navigator.storage.getDirectory();
  const inOpfs = await root.getDirectoryHandle(database).then(() => true, () => false); // IndexedDB fallback: nothing here
  if (inOpfs && (await neverOpened(root, database))) useResetOffer.setState({ database });
}

export async function confirmReset(database: string): Promise<void> {
  await requestReset(await navigator.storage.getDirectory(), database);
  location.reload();
}
