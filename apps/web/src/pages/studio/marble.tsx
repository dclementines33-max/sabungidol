// Marble Race (2026-11-18, user): everything about the marble race in one place — a free test race (nothing saved), the
// arenas (names, which ones are in the draw for matches), the LED screens' own pictures and how every race starts.
// Settings live in this browser (data/arenaSettings.ts).
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageHeader } from "../../components/PageHeader";
import { ArenaList } from "../../components/marble/ArenaList";
import { LedPhotos } from "../../components/marble/LedPhotos";
import { RaceDefaults } from "../../components/marble/RaceDefaults";
import { TestRace } from "../../components/marble/TestRace";

export const Route = createFileRoute("/studio/marble")({ component: MarbleRacePanel });

function MarbleRacePanel() {
  const [arena, setArena] = useState("");
  const test = useRef<HTMLElement>(null);
  const raceHere = (id: string) => { setArena(id); test.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div className="space-y-8">
      <PageHeader tag="Marble Race" title="Race night, your rules" note="Glass marbles with the idols inside race down 3D arenas. Pick Marble Race in any match to decide it on the track; test it here first." />
      <section ref={test} className="studio-section space-y-4" aria-labelledby="test-race">
        <h2 id="test-race" className="m-0 font-display">Test race</h2>
        <TestRace arena={arena} onArena={setArena} />
      </section>
      <section className="studio-section" aria-labelledby="arenas">
        <h2 id="arenas" className="m-0 mb-3 font-display">Arenas</h2>
        <ArenaList onRace={raceHere} />
      </section>
      <section className="studio-section" aria-labelledby="led">
        <h2 id="led" className="m-0 mb-3 font-display">LED screens</h2>
        <LedPhotos />
      </section>
      <section className="studio-section" aria-labelledby="night">
        <h2 id="night" className="m-0 mb-3 font-display">Race night</h2>
        <RaceDefaults />
      </section>
    </div>
  );
}
