// The parts of the data a backup can hold (PRD §12.3 "ekspor per bagian").
export type BackupSection = "idols" | "roster" | "season" | "rating" | "base" | "full";
export const SECTION_LABELS: Record<BackupSection, string> = {
  idols: "Idols + photos", roster: "Roster & settings", season: "One season", rating: "Rating",
  base: "Base data (idols, ratings, groups, branding, league rosters) — restored as Season 1", // the setup without any match
  full: "Full backup",
};
