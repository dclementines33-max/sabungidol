// The default idol data (seed/idols.json, user decision 2026-11-13): only photo, name, group and
// rating are used; every other field in the file is ignored. "Solo / Independent" means Soloist.
import { z } from "zod";

const SOLOIST_GROUP = "Solo / Independent";

const seedFileSchema = z.object({
  idols: z.array(z.object({
    name: z.string(),
    girlGroup: z.string().nullable().optional(),
    rating: z.number(),
    photoUrl: z.string().regex(/^data:image\/[\w+.-]+;base64,/, "Foto harus data URL base64"),
  })).min(1),
});

export type SeedIdol = { name: string; groupName: string | null; rating: number; photo: string };

export function seedIdols(file: unknown): SeedIdol[] {
  return seedFileSchema.parse(file).idols.map((i) => {
    const group = i.girlGroup?.trim();
    return { name: i.name.trim(), groupName: !group || group === SOLOIST_GROUP ? null : group, rating: Math.round(i.rating), photo: i.photoUrl };
  });
}
