// Pick a competition's accent from the 12 curated branding colours (PRD §10.1). A radio group,
// so arrow keys work and each colour has a name, not only a colour.
export const BRAND_COLORS = ["gold", "amber", "coral", "rose", "orchid", "violet", "indigo", "sky", "teal", "sage", "lime", "sand"] as const;
export type BrandColor = `brand-${(typeof BRAND_COLORS)[number]}`;

export function ColorSwatchPicker({ label, value, onChange }: { label: string; value: string | undefined; onChange: (color: BrandColor) => void }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="text-sm text-text-secondary">{label}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {BRAND_COLORS.map((c) => {
          const token = `brand-${c}` as BrandColor;
          return (
            <label key={c} title={c} className="cursor-pointer">
              <input type="radio" name={label} value={token} checked={value === token} onChange={() => onChange(token)} className="peer sr-only" aria-label={c} />
              <span className="block size-7 rounded-full border-2 border-bg-raised ring-accent-bright peer-checked:ring-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-bright"
                style={{ background: `var(--color-${token})` }} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
