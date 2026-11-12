// Input Data (PRD §8): paste lines, CSV and JSON all become the same rows, then each row is judged
// against the existing idols (idolRules) and checked (idolSchema). Green = new, yellow = warning,
// red = duplicate or invalid (not saved). An empty rating becomes 75 (user decision 2026-11-13).
import { judgeBatch, type IdolKey } from "./idolRules";
import { type IdolInput, idolInputSchema } from "./idolSchema";

export const DEFAULT_RATING = 75;
export type Fields = { name?: string; group?: string; rating?: string; seed?: string; nationality?: string; birthday?: string };
export type PreviewRow = {
  line: number;
  name: string;
  groupName: string | null;
  status: "new" | "warning" | "duplicate" | "invalid";
  reasons: string[];
  input?: IdolInput; // what will be saved (new and warning rows)
};

const blank = (s?: string) => (s ?? "").trim() === "";

// "Nama | Group | Rating | Seed | Nationality | YYYY-MM-DD", columns may be empty or missing.
export function pasteToFields(text: string): Fields[] {
  return text.split(/\r?\n/).filter((l) => l.trim()).map((l) => {
    const [name, group, rating, seed, nationality, birthday] = l.split("|").map((c) => c.trim());
    return { name, group, rating, seed, nationality, birthday };
  });
}

// CSV with a header row: name, group, rating, seed, nationality, birthday (quotes allowed).
export function csvToFields(text: string): Fields[] {
  const rows = text.split(/\r?\n/).filter((l) => l.trim()).map((l) =>
    [...l.matchAll(/("(?:[^"]|"")*"|[^,]*)(,|$)/g)].slice(0, -1).map((m) => m[1]!.replace(/^"|"$/g, "").replace(/""/g, '"').trim()));
  const header = (rows.shift() ?? []).map((h) => h.toLowerCase());
  return rows.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i]])) as Fields);
}

// JSON: an array of { name, group, rating, seed, nationality, birthday }.
export function jsonToFields(text: string): Fields[] {
  const data: unknown = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("JSON harus berupa daftar (array) idol");
  return data.map((o) => Object.fromEntries(Object.entries(o as object).map(([k, v]) => [k, v == null ? "" : String(v)])) as Fields);
}

export function previewBatch(fields: Fields[], existing: IdolKey[]): PreviewRow[] {
  const parsed = fields.map((f) => {
    const notes: string[] = [];
    const rating = blank(f.rating) ? (notes.push(`Rating kosong, dipakai ${DEFAULT_RATING}`), DEFAULT_RATING) : Number(f.rating);
    return {
      notes,
      key: { name: (f.name ?? "").trim(), groupName: blank(f.group) || /^soloist$/i.test(f.group!.trim()) ? null : f.group!.trim(), rating },
      rest: {
        seed: blank(f.seed) ? null : Number(f.seed),
        nationality: blank(f.nationality) ? null : f.nationality!.trim().toUpperCase(),
        birthday: blank(f.birthday) ? null : f.birthday!.trim(),
      },
    };
  });
  const verdicts = judgeBatch(parsed.map((p) => p.key), existing);
  return parsed.map((p, i) => {
    const verdict = verdicts[i]!;
    const row = { line: i + 1, name: p.key.name, groupName: p.key.groupName };
    if (verdict.status === "duplicate") return { ...row, status: "duplicate", reasons: verdict.reasons };
    const checked = idolInputSchema.safeParse({ ...p.key, rating: verdict.rating ?? p.key.rating, ...p.rest });
    if (!checked.success) return { ...row, status: "invalid", reasons: checked.error.issues.map((e) => e.message) };
    const reasons = [...verdict.reasons, ...p.notes];
    return { ...row, status: reasons.length ? "warning" : "new", reasons, input: checked.data };
  });
}
