// What a saved idol and group must look like (PRD §3). Checked wherever data comes in:
// the default data file, paste batch, the manual form, CSV/JSON import, backups.
import { z } from "zod";

export const idolInputSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(60, "Nama terlalu panjang (maks. 60)"),
  groupName: z.string().trim().min(1).max(60).nullable(), // null = Soloist
  rating: z.number().int("Rating harus bilangan bulat").min(0).max(100),
  seed: z.number().int().min(1).max(4).nullable().default(null),
  nationality: z.string().regex(/^[A-Z]{2}$/, "Kode negara 2 huruf, mis. KR").nullable().default(null),
  birthday: z.iso.date("Tanggal lahir YYYY-MM-DD").nullable().default(null),
  role: z.string().trim().max(80, "Role terlalu panjang (maks. 80)").nullable().optional(), // position in the group (Update 3)
});

export type IdolInput = z.infer<typeof idolInputSchema>;
