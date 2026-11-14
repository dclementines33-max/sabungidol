// The parts of the data a backup can hold (PRD §12.3 "ekspor per bagian").
export type BackupSection = "idols" | "roster" | "season" | "rating" | "base" | "full";
export const SECTION_LABELS: Record<BackupSection, string> = {
  idols: "Idol + foto", roster: "Roster & settings", season: "Season tertentu", rating: "Rating",
  base: "Data dasar (idol, rating, grup, branding, roster liga) — dipulihkan sebagai Season 1", // the setup without any match
  full: "Full backup",
};
