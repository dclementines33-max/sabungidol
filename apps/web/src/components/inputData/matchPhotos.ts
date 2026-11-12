// Mass photo drop (PRD §8): match each file name to an idol, fuzzily. "jang-wonyoung_IVE.webp"
// finds Jang Wonyoung of IVE. Only an exact name match counts as sure; anything else is a
// suggestion the user confirms or changes. Below MIN_SCORE there is no suggestion.
type Idol = { id: string; name: string; groupName: string | null };
export type PhotoMatch = { file: File; idolId: string | null; sure: boolean };

const MIN_SCORE = 0.75;
const norm = (s: string) => s.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const baseName = (file: string) => file.replace(/\.[^.]+$/, "");

// 1 = same text, 0 = nothing alike (edit distance relative to the longer one).
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return 1 - prev[b.length]! / Math.max(a.length, b.length);
}

export function matchPhotos(files: File[], idols: Idol[]): PhotoMatch[] {
  return files.map((file) => {
    const wanted = norm(baseName(file.name));
    let best: { id: string; score: number; sure: boolean } | null = null;
    for (const idol of idols) {
      const name = norm(idol.name);
      const group = norm(idol.groupName ?? "");
      // The name alone, or name + group in either order (to tell two idols with one name apart).
      const exactWithGroup = !!group && (wanted === name + group || wanted === group + name);
      const score = exactWithGroup ? 2 : wanted === name ? 1.5 : Math.max(similarity(wanted, name), group ? similarity(wanted, name + group) : 0);
      if (!best || score > best.score) best = { id: idol.id, score, sure: exactWithGroup || wanted === name };
    }
    // An exact name shared by two groups is not sure: the user picks.
    const sameName = idols.filter((i) => norm(i.name) === wanted).length;
    if (!best || best.score < MIN_SCORE) return { file, idolId: null, sure: false };
    return { file, idolId: best.id, sure: best.sure && (best.score === 2 || sameName === 1) };
  });
}
