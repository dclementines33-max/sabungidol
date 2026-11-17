// "Download Season Recap" (PRD §16): loads the champions' photos, draws the 1080 × 1350 card and saves it as a PNG.
import type { Title } from "@sabung/engine";
import { Button, useIdolLookup } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useBranding } from "../../data/branding";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { drawRecap, recapOrder } from "./recapCard";

export function RecapButton({ seasonName, titles }: { seasonName: string; titles: Partial<Record<string, Title>> }) {
  const { label } = useBranding();
  const lookup = useIdolLookup();
  const { data: idols = [] } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols() });
  const [busy, setBusy] = useState(false);
  const make = async () => {
    setBusy(true);
    try {
      const entries = await Promise.all(recapOrder(Object.keys(titles)).map(async (key) => {
        const id = titles[key]!.champion;
        const photoId = idols.find((i) => i.id === id)?.photoId;
        // a missing or broken photo file draws the card without that photo instead of stopping the whole recap
        const photo = photoId ? await engine().photoBlob(photoId, 1024).then((b) => (b ? createImageBitmap(b) : null)).catch(() => null) : null;
        return { key, label: label(key), name: lookup(id)?.name ?? id, group: lookup(id)?.groupName ?? null, photo };
      }));
      await document.fonts.ready;
      const canvas = document.createElement("canvas");
      drawRecap(canvas, seasonName, entries);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${seasonName.toLowerCase().replace(/\s+/g, "-")}-recap.png`;
      link.click();
    } finally {
      setBusy(false);
    }
  };
  return <Button variant="primary" disabled={busy || Object.keys(titles).length === 0} onClick={make}>{busy ? "Drawing…" : "Download Season Recap"}</Button>;
}
