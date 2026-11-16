// An idol's photo, portrait 4:5 (PRD §10.3). Without a photo: initials on the group colour.
import { useEffect, useRef, useState } from "react";
import { type PhotoSize, useIdol, useIdolPhoto } from "./idolSource";

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");

// size = which stored photo to load (64 list, 256 card, 1024 hero). The shown width comes from className.
export function IdolPhoto({ idolId, size, className = "w-16" }: { idolId: string; size: PhotoSize; className?: string }) {
  const idol = useIdol(idolId);
  // Ask for the photo only once it is near the screen: a grid of 480 idols must not queue every photo before the visible ones.
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === "undefined");
  useEffect(() => {
    if (near || !box.current) return;
    const watch = new IntersectionObserver((seen) => { if (seen.some((s) => s.isIntersecting)) setNear(true); }, { rootMargin: "400px" });
    watch.observe(box.current);
    return () => watch.disconnect();
  }, [near]);
  const src = useIdolPhoto(near ? idolId : "", size);
  const frame = `${className} aspect-[4/5] overflow-hidden rounded-control`;
  if (src) return <img src={src} alt={idol.name} loading="lazy" decoding="async" className={`${frame} object-cover`}
    style={idol.focal ? { objectPosition: `${idol.focal[0] * 100}% ${idol.focal[1] * 100}%` } : undefined} />;
  return (
    <div
      ref={box}
      role="img"
      aria-label={idol.name}
      className={`${frame} flex items-center justify-center font-display text-on-fill`}
      style={{ background: `var(--color-${idol.groupColor ?? "muted"})`, containerType: "inline-size" }}
    >
      <span aria-hidden="true" style={{ fontSize: "40cqi" }}>{initials(idol.name)}</span>
    </div>
  );
}
