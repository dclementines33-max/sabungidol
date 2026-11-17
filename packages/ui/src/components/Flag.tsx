// A nationality as a small flag image (2026-11-17): emoji flags don't render on Windows, so the countries the data uses are
// self-hosted SVGs (apps/web/public/flags/<code>.svg). The image's alt is the country's English name; a country without a
// file shows its two letters, labelled the same way.
const FLAGS = new Set(["AU", "CN", "HK", "ID", "IT", "JP", "KR", "PH", "SE", "TH", "TW", "US", "VN"]);
const names = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
export const countryName = (code: string) => names?.of(code.toUpperCase()) ?? code.toUpperCase();

// decorative: the country's name is already written next to it (alt="").
export function Flag({ code, className = "h-3.5", decorative = false }: { code: string; className?: string; decorative?: boolean }) {
  const cc = code.toUpperCase();
  if (!FLAGS.has(cc)) return decorative ? null : <span role="img" aria-label={countryName(cc)} className="font-mono text-xs">{cc}</span>;
  return <img src={`/flags/${cc.toLowerCase()}.svg`} alt={decorative ? "" : countryName(cc)} className={`${className} aspect-[3/2] rounded-[2px] object-cover shadow-[0_0_0_1px_rgb(0_0_0/0.35)]`} />;
}
