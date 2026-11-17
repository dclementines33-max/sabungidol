// A row of skewed chips, one pressed (the KindSwitch look): best of, camera, quality, speed on the Marble Race panel.
export function Choice<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly { id: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      <span className="kicker mr-2 text-text-secondary">{label}</span>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}
          className={`chip py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bright ${value === o.id ? "bg-accent text-on-accent" : "bg-stage-hi text-text-secondary hover:text-text-primary"}`}>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
