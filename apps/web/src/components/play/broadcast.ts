// The league broadcast clock (2026-11-17): the timeline and the live standings below it move together, one matchday at a
// time. A plain matchday shows for DAY_MS; a matchday that brings a timeline point (a story) holds for STORY_MS so it can
// be read. After the league, any non-league points (The Idols playoff) and the finale follow at STORY_MS each.
export const DAY_MS = 700;
export const STORY_MS = 2600;

export type Frame = { at: number; day: number; ms: number }; // at = the timeline card shown; day = the standings' matchday

const lgDay = (p: { stage: string; round: string }) => (p.stage === "LG" ? Number(p.round.slice(2)) : null);

export function broadcastFrames(points: { stage: string; round: string }[], finale: boolean, lastDay: number): Frame[] {
  const days = points.map(lgDay);
  const league = days.filter((d): d is number => d !== null);
  const last = Math.max(lastDay, ...league);
  const frames: Frame[] = [];
  let at = -1;
  // shortcut: starts at the first matchday with a story (the timeline doesn't say which matchday the play began on).
  for (let day = league.length ? Math.min(...league) : last + 1; day <= last; day++) {
    const next = days.reduce<number>((n, d, i) => (d !== null && d <= day ? i : n), -1);
    if (next > at) for (let i = at + 1; i <= next; i++) frames.push({ at: i, day, ms: STORY_MS }); // each story on this matchday holds on its own
    else frames.push({ at, day, ms: DAY_MS });
    at = Math.max(at, next);
  }
  const after = points.length + (finale ? 1 : 0);
  for (let i = at + 1; i < after; i++) frames.push({ at: i, day: last, ms: STORY_MS });
  return frames;
}
