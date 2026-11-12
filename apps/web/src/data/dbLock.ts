// One tab at a time per database (found in Fase 1 step 10: a second Worker on the same OPFS
// database is refused with an unclear error). The Worker takes a Web Lock before opening the
// database and keeps it for its whole life; the browser frees it when the tab closes.
export const DB_IN_OTHER_TAB = "E-DB-002";

type Locks = Pick<LockManager, "request">;

export function holdDatabaseLock(database: string, locks: Locks | undefined = globalThis.navigator?.locks): Promise<boolean> {
  if (!locks) return Promise.resolve(true); // no Web Locks: cannot tell, OPFS still refuses a second holder
  return new Promise((resolve) => {
    locks.request(`sabung-db:${database}`, { ifAvailable: true }, (lock) => {
      resolve(lock !== null);
      return lock ? new Promise<never>(() => {}) : undefined; // never settles: the lock is held until the Worker ends
    });
  });
}
