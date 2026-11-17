// The Sabung Idol icon kit (2026-11-17, task 3, replaces lucide + the Y2K chrome stroke): every glyph leans forward like the
// skewed chips, has a translucent ink mass under its outline and at most one "spark" (an eye, a star, a bolt) cut out of
// the background. Colours: theme.css `svg.si` rules; .icon-tone turns the spark gold where the icon itself is red.
import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { size?: number | string };
export type Icon = ((props: IconProps) => ReactNode) & { displayName?: string };

const LEAN = "matrix(1 0 -0.12 1 1.44 0)"; // skewX(-7°) around the middle row

export function icon(name: string, body: ReactNode): Icon {
  const C: Icon = ({ size = 24, strokeWidth = 2, className, ...rest }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={rest["aria-label"] ? undefined : true} role={rest["aria-label"] ? "img" : undefined}
      className={`si si-${name}${className ? ` ${className}` : ""}`} {...rest}
    >
      <g transform={LEAN}>{body}</g>
    </svg>
  );
  C.displayName = name;
  return C;
}

// Pieces the glyphs are made of.
export const Line = ({ d }: { d: string }) => <path d={d} />;
export const Ink = ({ d }: { d: string }) => <path className="si-ink" d={d} />;
export const Hot = ({ d }: { d: string }) => <path className="si-hot" d={d} />; // a stroke in the spark colour
export const Spark = ({ d, tone = "" }: { d: string; tone?: "" | "gold" | "cool" }) => <path className={`si-spark${tone ? ` si-${tone}` : ""}`} d={d} />;
export const Cut = ({ cx, cy, r }: { cx: number; cy: number; r: number }) => <circle className="si-cut" cx={cx} cy={cy} r={r} />;

// A four-point sparkle.
export const star = (cx: number, cy: number, r: number) => {
  const k = r * 0.28;
  return `M${cx} ${cy - r}L${cx + k} ${cy - k}L${cx + r} ${cy}L${cx + k} ${cy + k}L${cx} ${cy + r}L${cx - k} ${cy + k}L${cx - r} ${cy}L${cx - k} ${cy - k}Z`;
};

// The surreal eye that looks out of houses, lenses, gears and databases.
export const Eye = ({ cx, cy, w, tone = "" }: { cx: number; cy: number; w: number; tone?: "" | "gold" }) => (
  <>
    <Spark tone={tone} d={`M${cx - w} ${cy}Q${cx} ${cy - w * 0.95} ${cx + w} ${cy}Q${cx} ${cy + w * 0.95} ${cx - w} ${cy}Z`} />
    <Cut cx={cx} cy={cy} r={w * 0.36} />
  </>
);

// A gear outline: n teeth between radius ro and ri, centred on the box.
export function cog(n: number, ro: number, ri: number) {
  const pts = Array.from({ length: n * 4 }, (_, i) => {
    const a = (i / (n * 4)) * Math.PI * 2 - Math.PI / 2 + Math.PI / (n * 4);
    const r = i % 4 < 2 ? ro : ri;
    return `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  });
  return `M${pts.join("L")}Z`;
}
