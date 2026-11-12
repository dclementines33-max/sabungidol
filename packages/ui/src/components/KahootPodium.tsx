// Top-3 podium (PRD §9): photos on top, the blocks rise in order 3 → 2 → 1.
// Pure CSS animation, so the podium always ends visible. With prefers-reduced-motion: a short fade, no delay.
import { IdolPhoto } from "./IdolPhoto";
import { useIdol } from "./idolSource";

export const RISE_GAP_MS = 400; // time between one place rising and the next
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const PLACES = [
  { place: 2, height: "h-24", order: 1 }, // left
  { place: 1, height: "h-32", order: 2 }, // middle
  { place: 3, height: "h-16", order: 0 }, // right; rises first
] as const;

function Step({ idolId, place, height, delay, still }: { idolId: string; place: number; height: string; delay: number; still: boolean }) {
  const idol = useIdol(idolId);
  return (
    <li
      aria-label={`Juara ${place}: ${idol.name}`}
      className={`${still ? "animate-fade-in" : "animate-rise"} flex w-28 flex-col items-center sm:w-36`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <IdolPhoto idolId={idolId} size={256} className="w-full" />
      <p className="m-0 mt-2 w-full truncate text-center font-display text-sm">{idol.name}</p>
      <div className={`${height} ${place === 1 ? "bg-accent" : "bg-surface-hover"} mt-2 flex w-full items-start justify-center rounded-t-card pt-2`}>
        <span className={`${place === 1 ? "text-on-accent" : "text-text-primary"} font-display text-xl`} aria-hidden="true">{place}</span>
      </div>
    </li>
  );
}

export function KahootPodium({ first, second, third, title }: { first: string; second: string; third: string; title?: string }) {
  const still = reducedMotion();
  const idolFor = { 1: first, 2: second, 3: third };
  return (
    <figure className="m-0">
      {title && <figcaption className="mb-4 text-center font-display text-xl">{title}</figcaption>}
      <ol className="m-0 flex list-none items-end justify-center gap-2 p-0">
        {PLACES.map(({ place, height, order }) => (
          <Step key={place} idolId={idolFor[place]} place={place} height={height} delay={still ? 0 : order * RISE_GAP_MS} still={still} />
        ))}
      </ol>
    </figure>
  );
}
