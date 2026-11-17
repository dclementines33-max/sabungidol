// "Marble Race" in the match dialog: the arena(s) this match is played on and a button that opens the 3D race on the
// whole screen (a nested dialog, so focus and Esc stay right). The LED screens show the competition, both idols' photos,
// the competition logo and one of the user's own LED photos. The finished race hands its games back to the dialog,
// which saves them like any other result.
import type { Side } from "@sabung/engine";
import { Button, useIdol, useIdolPhoto } from "@sabung/ui";
import { useState } from "react";
import { useArenaName, useArenaSettings } from "../../data/arenaSettings";
import { photoUrl, requestPhoto, usePhotoUrls } from "../../data/photoCache";
import type { RaceLed } from "../../marble/controller";
import { RaceDialog } from "./RaceDialog";

export function MarbleMatch({ idolA, idolB, bestOf, arenas, title, logoId, onGames }: {
  idolA: string; idolB: string; bestOf: number; arenas: string[]; title: string; logoId?: string | null; onGames: (games: Side[]) => void;
}) {
  const a = useIdol(idolA), b = useIdol(idolB);
  const photoA = useIdolPhoto(idolA, 1024), photoB = useIdolPhoto(idolB, 1024);
  const { names, led, setup } = useArenaSettings();
  const arenaName = useArenaName();
  usePhotoUrls((s) => s.urls);
  const logo = logoId ? photoUrl(logoId, 256) : undefined;
  if (logoId && !logo) queueMicrotask(() => requestPhoto(logoId, 256));
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);

  const photos: RaceLed["photos"] = [];
  if (photoA) photos.push({ url: photoA, caption: a.name });
  if (photoB) photos.push({ url: photoB, caption: b.name });
  if (logo) photos.push({ url: logo, contain: true });
  else if (led.length) photos.push({ url: led[Math.floor(Math.random() * led.length)]! });
  const screens: RaceLed = { title, photos };
  const players = [
    { name: a.name, photo: useIdolPhoto(idolA, 256) ?? null, rating: a.rating },
    { name: b.name, photo: useIdolPhoto(idolB, 256) ?? null, rating: b.rating },
  ];

  return (
    <div className="text-center">
      <p className="kicker m-0 text-text-secondary">{arenas.length > 1 ? "Grand final · a new arena every game" : "Tonight's arena"}</p>
      <p className="m-0 mt-1 font-gothic text-xl leading-tight">{arenas.length > 1 ? arenas.map(arenaName).join(" → ") : arenaName(arenas[0]!)}</p>
      <p className="m-0 mt-2 text-sm text-text-secondary">One run = one game. The higher rating gets a small edge; boost pads and bumpers keep it open.</p>
      <Button variant="primary" className="mt-4" onClick={() => { setRun((n) => n + 1); setOpen(true); }}>Start the marble race</Button>

      <RaceDialog open={open} onOpenChange={setOpen} label={`Marble race · ${a.name} vs ${b.name}`} title={title} run={run}
        options={{ players, bestOf, arenaIds: arenas, advantage: setup.advantage, led: screens, names }}
        actions={(s) => (
          <>
            <Button variant="primary" onClick={() => { onGames(s.games); setOpen(false); }}>Use this result</Button>
            <Button onClick={() => setRun((n) => n + 1)}>Race again</Button>
          </>
        )} />
    </div>
  );
}
