// An idol's photo, portrait 4:5 (PRD §10.3). Without a photo: initials on the group colour.
import { type PhotoSize, useIdol, useIdolPhoto } from "./idolSource";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");

// size = which stored photo to load (64 list, 256 card, 1024 hero). The shown width comes from className.
export function IdolPhoto({ idolId, size, className = "w-16" }: { idolId: string; size: PhotoSize; className?: string }) {
  const idol = useIdol(idolId);
  const src = useIdolPhoto(idolId, size);
  const frame = `${className} aspect-[4/5] overflow-hidden rounded-control`;
  if (src) return <img src={src} alt={idol.name} loading="lazy" decoding="async" className={`${frame} object-cover`} />;
  return (
    <div
      role="img"
      aria-label={idol.name}
      className={`${frame} flex items-center justify-center font-display text-on-fill`}
      style={{ background: `var(--color-${idol.groupColor ?? "neutral-taupe"})`, containerType: "inline-size" }}
    >
      <span aria-hidden="true" style={{ fontSize: "40cqi" }}>{initials(idol.name)}</span>
    </div>
  );
}
