// Steps several round-by-round competitions together: round 1 of each, then round 2 of each, ...
// (user decision: cups are interleaved like a real calendar). Yields after every full lap.
export function* interleave<T>(tracks: Generator<void, T>[]): Generator<void, T[]> {
  const results: T[] = [];
  const running = new Set(tracks.keys());
  while (running.size > 0) {
    for (const i of running) {
      const step = tracks[i].next();
      if (step.done) { results[i] = step.value; running.delete(i); }
    }
    if (running.size > 0) yield;
  }
  return results;
}

export function finish<T>(track: Generator<void, T>): T {
  for (;;) { const step = track.next(); if (step.done) return step.value; }
}
