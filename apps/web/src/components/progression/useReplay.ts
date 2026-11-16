// A matchday replay (2026-11-17): which matchday a chart shows, and playing through them. It starts on the last matchday
// (the full chart, as before); Play from the end starts again at matchday 1. Only ever runs when the user presses Play.
import { useEffect, useState } from "react";

export const REPLAY_STEP_MS = 450;

export function useReplay(total: number) {
  const [day, setDay] = useState<number | null>(null); // null = follow the latest matchday
  const [playing, setPlaying] = useState(false);
  const shown = Math.min(day ?? total, total);
  useEffect(() => {
    if (!playing) return;
    if (shown >= total) { setPlaying(false); return; }
    const timer = setTimeout(() => setDay(shown + 1), REPLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, shown, total]);
  return {
    day: shown, total, playing,
    toggle: () => { if (!playing && shown >= total) setDay(1); setPlaying(!playing); },
    replay: () => { setDay(1); setPlaying(true); },
    seek: (d: number) => { setPlaying(false); setDay(d); },
  };
}
