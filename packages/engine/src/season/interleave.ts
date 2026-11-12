// Steps several round-by-round competitions together: round 1 of each, then round 2 of each, ...
// (user decision: cups are interleaved like a real calendar). Yields after every full lap.
// A track that reaches a match it may not play yet (PENDING, replay) stops; the others go on. At the
// end a blocked track makes the whole interleave PENDING, unless the caller asks for the partial
// results (then a blocked track's result is undefined).
import { PENDING } from "./types";

export function* interleave<T>(tracks: Generator<void, T>[], { partial = false } = {}): Generator<void, (T | undefined)[]> {
  const results: (T | undefined)[] = [];
  const running = new Set(tracks.keys());
  let blocked = false;
  while (running.size > 0) {
    for (const i of running) {
      try {
        const step = tracks[i].next();
        if (step.done) { results[i] = step.value; running.delete(i); }
      } catch (error) {
        if (error !== PENDING) throw error;
        blocked = true;
        running.delete(i);
      }
    }
    if (running.size > 0) yield;
  }
  if (blocked && !partial) throw PENDING;
  return results;
}

export function finish<T>(track: Generator<void, T>): T {
  for (;;) { const step = track.next(); if (step.done) return step.value; }
}
