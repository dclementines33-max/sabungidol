// How a new idol compares with the ones already there (PRD §8 Input Data, §14.3):
// green = new; yellow = warning (same name in another group, rating outside 0–100);
// red = exact duplicate (same name and same group, or two soloists), refused.
export type IdolKey = { name: string; groupName: string | null };
export type Verdict = { status: "new" | "warning" | "duplicate"; reasons: string[]; rating?: number };

const norm = (s: string | null) => (s ?? "").trim().toLowerCase();
const label = (i: IdolKey) => `${i.name.trim()} (${i.groupName ?? "Soloist"})`;

export function judgeIdol(candidate: IdolKey & { rating?: number }, others: IdolKey[]): Verdict {
  const sameName = others.filter((o) => norm(o.name) === norm(candidate.name));
  const exact = sameName.find((o) => norm(o.groupName) === norm(candidate.groupName));
  if (exact) return { status: "duplicate", reasons: [`Duplikat persis: ${label(exact)} sudah ada`] };

  const reasons = sameName.map((o) => `Nama sama dengan ${label(o)} — dianggap idol berbeda`);
  let rating = candidate.rating;
  if (rating !== undefined && (rating < 0 || rating > 100)) {
    reasons.push(`Rating ${rating} di luar 0–100, dipakai ${Math.min(100, Math.max(0, Math.round(rating)))}`);
    rating = Math.min(100, Math.max(0, Math.round(rating)));
  }
  return { status: reasons.length ? "warning" : "new", reasons, rating };
}

// A whole batch: each line is judged against the existing idols and the lines before it.
export function judgeBatch<T extends IdolKey & { rating?: number }>(batch: T[], existing: IdolKey[]): Verdict[] {
  const seen: IdolKey[] = [...existing];
  return batch.map((candidate) => {
    const verdict = judgeIdol(candidate, seen);
    if (verdict.status !== "duplicate") seen.push(candidate);
    return verdict;
  });
}
