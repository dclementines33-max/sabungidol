// Marble Race panel · Race night: how every race starts (camera, speed, picture quality) and how much a rating edge
// counts. The edge is a small push along the run and a little less drag for the higher-rated marble; 0 = pure physics.
import { useArenaSettings } from "../../data/arenaSettings";
import { Choice } from "./Choice";

export function RaceDefaults() {
  const { setup, setSetup } = useArenaSettings();
  return (
    <div className="space-y-4">
      <Choice label="Camera" value={setup.camera} onChange={(camera) => setSetup({ camera })}
        options={[{ id: "tv", label: "TV" }, { id: "chase", label: "Chase" }, { id: "free", label: "Free" }]} />
      <Choice label="Speed" value={setup.speed} onChange={(speed) => setSetup({ speed })}
        options={[{ id: 1, label: "1×" }, { id: 2, label: "2×" }, { id: 4, label: "4×" }]} />
      <Choice label="Quality" value={setup.quality} onChange={(quality) => setSetup({ quality })}
        options={[{ id: "high", label: "High" }, { id: "low", label: "Low (older phones)" }]} />
      <label className="flex flex-wrap items-center gap-3 text-sm">
        <span className="kicker text-text-secondary">Rating edge</span>
        <input type="range" min={0} max={2} step={0.1} value={setup.advantage} onChange={(e) => setSetup({ advantage: +e.target.value })} className="accent-accent-bright" />
        <output className="score text-lg">{setup.advantage.toFixed(1)}×</output>
        <span className="text-text-secondary">{setup.advantage === 0 ? "Pure physics: ratings don't count." : "1.0× = a 95 beats an 84 about 7 times in 10."}</span>
      </label>
    </div>
  );
}
