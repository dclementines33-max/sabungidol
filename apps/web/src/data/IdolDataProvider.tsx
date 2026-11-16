// Feeds the design system's idol components from the database (PRD §9: components take an idolId).
// Idols come from the Worker through TanStack Query; photos load on first use and show initials until then.
import { type IdolSource, IdolSourceProvider } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useMemo } from "react";
import { engine } from "./engineClient";
import { requestPhoto, usePhotoUrls } from "./photoCache";

export const IDOLS_QUERY = ["idols"] as const;

// A steady placeholder colour per group (the 12 branding colours); soloists get the neutral one.
const COLOURS = ["gold", "amber", "coral", "rose", "orchid", "violet", "indigo", "sky", "teal", "sage", "lime", "sand"];
export function groupColour(groupId: string | null): string | undefined {
  if (!groupId) return undefined;
  let hash = 0;
  for (const ch of groupId) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return `brand-${COLOURS[hash % COLOURS.length]}`;
}

export function IdolDataProvider({ children }: { children: ReactNode }) {
  const { data: idols = [] } = useQuery({
    queryKey: IDOLS_QUERY,
    queryFn: () => engine().listIdols(),
    enabled: typeof Worker !== "undefined", // tests and prerendering have no Worker
  });
  const urls = usePhotoUrls((s) => s.urls);
  const source = useMemo<IdolSource>(() => {
    const byId = new Map(idols.map((i) => [i.id, i]));
    const source: IdolSource = {
      idol: (id) => {
        const i = byId.get(id);
        return i && { id: i.id, name: i.name, groupName: i.groupName, groupColor: groupColour(i.groupId), rating: i.rating, active: i.active, gallery: i.gallery,
          focal: i.focalX != null && i.focalY != null ? [i.focalX, i.focalY] as [number, number] : undefined,
          nationality: i.nationality, birthday: i.birthday, groupLogoId: i.groupLogoId };
      },
      photo: (id, size) => {
        const photoId = byId.get(id)?.photoId;
        return photoId ? source.galleryPhoto!(photoId, size) : undefined;
      },
      galleryPhoto: (photoId, size) => {
        if (!photoId) return undefined;
        const url = urls[`${photoId}:${size}`];
        if (!url) queueMicrotask(() => requestPhoto(photoId, size)); // not during render
        return url;
      },
    };
    return source;
  }, [idols, urls]);
  return <IdolSourceProvider source={source}>{children}</IdolSourceProvider>;
}
