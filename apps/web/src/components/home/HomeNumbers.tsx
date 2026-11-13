// Home's all-time numbers as one swiss-punk line (Update 2): idols / groups / matches / seasons done, huge, split by slashes.
export function HomeNumbers({ idols, groups, matches, seasons }: { idols: number; groups: number; matches: number; seasons: number }) {
  const items = [[idols, "idol"], [groups, "girl group"], [matches, "match sepanjang masa"], [seasons, "season selesai"]] as const;
  return (
    <section aria-label="Angka sepanjang masa" className="-mx-1">
      <dl className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        {items.map(([value, label], i) => (
          <div key={label} className="flex items-baseline gap-2">
            {i > 0 && <span aria-hidden="true" className="font-display text-[clamp(2rem,6vw,4.5rem)] leading-none text-accent">/</span>}
            <dd className="m-0 font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-none tabular-nums">{value.toLocaleString("id-ID")}</dd>
            <dt className="kicker max-w-[8ch] text-text-secondary">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
