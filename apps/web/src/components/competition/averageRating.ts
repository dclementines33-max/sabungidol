// The average rating of a league's roster, one decimal ("-" for an empty roster).
export function averageRating(ratings: number[]): string {
  if (ratings.length === 0) return "-";
  return (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1);
}
