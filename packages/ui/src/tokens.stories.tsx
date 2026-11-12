// Shows every token from tokens.css so a person can review the design system (PRD §10).
import type { Meta, StoryObj } from "@storybook/react-vite";

const colors = [
  "bg-base", "bg-raised", "surface", "surface-hover", "border", "border-strong", "text-primary", "text-secondary",
  "accent-gold", "accent-coral", "accent-sage", "accent-sky", "neutral-taupe", "danger",
];
const brands = ["gold", "amber", "coral", "rose", "orchid", "violet", "indigo", "sky", "teal", "sage", "lime", "sand"];
// Full class names: Tailwind only generates classes it can read whole in the source.
const sizes = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"];

function Swatch({ name }: { name: string }) {
  return (
    <figure className="m-0">
      <div className="h-16 w-28 rounded-control border border-border-strong" style={{ background: `var(--color-${name})` }} />
      <figcaption className="mt-2 font-mono text-xs text-text-secondary">{name}</figcaption>
    </figure>
  );
}

function Tokens() {
  return (
    <div className="space-y-8 bg-bg-base p-8">
      <section>
        <h2 className="font-display text-xl">Colours</h2>
        <div className="mt-4 flex flex-wrap gap-4">{colors.map((c) => <Swatch key={c} name={c} />)}</div>
      </section>
      <section>
        <h2 className="font-display text-xl">Competition branding</h2>
        <div className="mt-4 flex flex-wrap gap-4">{brands.map((b) => <Swatch key={b} name={`brand-${b}`} />)}</div>
      </section>
      <section>
        <h2 className="font-display text-xl">Type</h2>
        {sizes.map((s) => <p key={s} className={`${s} m-0`}>Sabung Idol <span className="font-mono text-xs text-text-secondary">{s}</span></p>)}
        <p className="font-mono text-base tabular-nums">3–1 · 2–2 · 0–3</p>
      </section>
    </div>
  );
}

const meta: Meta<typeof Tokens> = { title: "Design system/Tokens", component: Tokens };
export default meta;
export const All: StoryObj<typeof Tokens> = {};
