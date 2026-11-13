// The event log (PRD §12.1, §14.1): every notification, so the NotificationCenter keeps its
// history across visits and the user can export it.
import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "./openDb";
import { eventLog } from "./schema";

export type EventLevel = "info" | "success" | "warning" | "blocker" | "error";
export type NewEvent = { level: EventLevel; message: string; code?: string; context?: unknown };
export type LoggedEvent = { id: number; level: EventLevel; message: string; code: string | null; context: unknown; at: string };

const toLogged = (row: typeof eventLog.$inferSelect): LoggedEvent => ({ ...row, level: row.level as EventLevel, at: row.at.toISOString() });

// oncePerDay: a coded event that repeats on every visit (e.g. storage permission refused) is
// written once per day (UTC), so the log does not fill up with copies. Returns null when skipped.
export async function logEvent(db: Db, event: NewEvent, { oncePerDay = false } = {}): Promise<LoggedEvent | null> {
  if (oncePerDay && event.code) {
    const today = await db.select({ id: eventLog.id }).from(eventLog)
      .where(and(eq(eventLog.code, event.code), sql`${eventLog.at} >= date_trunc('day', now())`)).limit(1);
    if (today.length > 0) return null;
  }
  const [row] = await db.insert(eventLog).values({ level: event.level, message: event.message, code: event.code, context: event.context }).returning();
  return toLogged(row);
}

// Newest first.
export async function listEvents(db: Db, limit = 200): Promise<LoggedEvent[]> {
  return (await db.select().from(eventLog).orderBy(desc(eventLog.id)).limit(limit)).map(toLogged);
}

// When an event with this code last happened (null = never), e.g. the last backup.
export async function lastEventAt(db: Db, code: string): Promise<string | null> {
  const [row] = await db.select({ at: eventLog.at }).from(eventLog).where(eq(eventLog.code, code)).orderBy(desc(eventLog.at)).limit(1);
  return row ? row.at.toISOString() : null;
}

// Every event with one code, oldest first (e.g. the user's final predictions).
export async function listEventsByCode(db: Db, code: string): Promise<LoggedEvent[]> {
  return (await db.select().from(eventLog).where(eq(eventLog.code, code)).orderBy(eventLog.id)).map(toLogged);
}
