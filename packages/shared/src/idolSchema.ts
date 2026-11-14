// What a saved idol and group must look like (PRD §3). Checked wherever data comes in:
// the default data file, paste batch, the manual form, CSV/JSON import, backups.
import { z } from "zod";

export const idolInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long (max 60)"),
  groupName: z.string().trim().min(1).max(60).nullable(), // null = Soloist
  rating: z.number().int("Rating must be a whole number").min(0).max(100),
  seed: z.number().int().min(1).max(4).nullable().default(null),
  nationality: z.string().regex(/^[A-Z]{2}$/, "2-letter country code, e.g. KR").nullable().default(null),
  birthday: z.iso.date("Birthday as YYYY-MM-DD").nullable().default(null),
  role: z.string().trim().max(80, "Role is too long (max 80)").nullable().optional(), // position in the group (Update 3)
});

export type IdolInput = z.infer<typeof idolInputSchema>;
