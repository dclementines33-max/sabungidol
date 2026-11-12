// Ask the browser not to wipe our data when storage runs low (PRD §12).
// true = granted, false = refused (the user must be told, §14.3), null = the browser cannot say.
export async function askPersistentStorage(): Promise<boolean | null> {
  const storage = typeof navigator === "undefined" ? undefined : navigator.storage;
  if (!storage?.persist || !storage.persisted) return null;
  try {
    return (await storage.persisted()) || (await storage.persist());
  } catch {
    return null;
  }
}
