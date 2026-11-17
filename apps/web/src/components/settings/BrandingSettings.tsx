// Settings → Branding (PRD §8, §10.1): each competition's display name, accent colour and logo.
// Every D1 league has its own; D2X follows D1X ("… · Divisi 2"). Codes never change; only what is shown does.
import type { Branding } from "@sabung/db";
import { D1_LEAGUES, SEASON_COMPETITIONS } from "@sabung/shared";
import { Button, ColorSwatchPicker } from "@sabung/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { engine } from "../../data/engineClient";
import { notify } from "../../data/notices";
import { queryClient } from "../../data/queryClient";
import { SEASON_QUERY } from "../../data/seasonQuery";
import { CompetitionLogo } from "../CompetitionLogo";
import { FIELD, SECTION } from "./settingsShared";

type Row = { name: string; branding: Branding };
const ROWS = [
  ...D1_LEAGUES.map((code) => ({ key: code, name: `League ${code}` })),
  ...SEASON_COMPETITIONS.filter((c) => c.key !== "D1" && c.key !== "D2").map((c) => ({ key: c.key as string, name: c.name })),
];

export function BrandingSettings({ seasonId }: { seasonId: string }) {
  const key = [...SEASON_QUERY, "competitions", seasonId];
  const { data: saved = [] } = useQuery({ queryKey: key, queryFn: () => engine().listCompetitions(seasonId) });
  const [edits, setEdits] = useState<Record<string, Row>>({});
  const rowFor = (code: string, fallback: string): Row => {
    if (edits[code]) return edits[code];
    const s = saved.find((c) => c.code === code);
    return { name: s?.name ?? fallback, branding: (s?.branding as Branding | null) ?? {} };
  };
  const edit = (code: string, fallback: string, change: Partial<Row>) => setEdits({ ...edits, [code]: { ...rowFor(code, fallback), ...change } });
  const save = async (code: string, fallback: string) => {
    const row = rowFor(code, fallback);
    await engine().saveCompetition(seasonId, code, row.name.trim() || fallback, row.branding);
    notify({ level: "success", message: `Branding ${row.name} saved` });
    await queryClient.invalidateQueries({ queryKey: key });
  };
  const uploadLogo = async (code: string, fallback: string, file: File) => {
    try {
      const logoId = await engine().savePhoto(file);
      edit(code, fallback, { branding: { ...rowFor(code, fallback).branding, logoId } });
    } catch (error) {
      notify({ level: "error", code: "E-BRAND-001", message: "Logo not saved.", context: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <section className={SECTION} aria-labelledby="set-branding">
      <h2 id="set-branding" className="m-0 font-display">Competition branding</h2>
      <p className="m-0 text-sm text-text-secondary">Each Division 2 league uses its D1 league's logo and colour, named "… · Division 2".</p>
      <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
        {ROWS.map((c) => {
          const row = rowFor(c.key, c.name);
          const d2 = c.key.startsWith("D1") ? ` (also D2${c.key[2]})` : "";
          return (
            <li key={c.key} className="space-y-2 panel border-l-4 p-3" style={{ borderLeftColor: row.branding.color ? `var(--color-${row.branding.color})` : undefined }}>
              <label className="block text-sm text-text-secondary">Display name ({c.key}{d2})<input value={row.name} maxLength={40} onChange={(e) => edit(c.key, c.name, { name: e.target.value })} className={FIELD} /></label>
              <ColorSwatchPicker label={`Accent colour ${c.key}`} value={row.branding.color} onChange={(color) => edit(c.key, c.name, { branding: { ...row.branding, color } })} />
              <div className="flex items-center gap-3">
                <CompetitionLogo logoId={row.branding.logoId} />
                <label className="text-sm text-text-secondary">Logo {c.key}<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadLogo(c.key, c.name, e.target.files[0])} className="mt-1 block text-text-primary" /></label>
              </div>
              <Button className="px-3 py-1" onClick={() => save(c.key, c.name)}>Save {c.key}</Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
