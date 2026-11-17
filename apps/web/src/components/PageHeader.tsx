// An editorial page opener (redesign brief; Update 2 polish): tag, a big headline, one line of explanation, and the
// page's word again as a giant outline behind. The shell's own <h1> keeps the panel name. Design round 2 (Fight Night):
// a skewed crimson light band behind the title and a glowing slash under it, like a fight poster.
export function PageHeader({ tag, title, note }: { tag: string; title: string; note?: string }) {
  return (
    <header className="relative isolate overflow-hidden pt-2 pb-2">
      <span aria-hidden="true" className="absolute top-0 -left-6 -z-20 h-full w-3/4 -skew-x-12 bg-[linear-gradient(90deg,color-mix(in_oklab,var(--color-accent)_40%,transparent),transparent_85%)]" />
      <p aria-hidden="true" className="outline-text pointer-events-none absolute -top-2 right-0 -z-10 m-0 font-display text-ornament leading-none whitespace-nowrap opacity-25">{tag}</p>
      <p className="m-0"><span className="tag">{tag}</span></p>
      <h2 className="m-0 mt-3 max-w-[18ch] text-hero [text-shadow:0_6px_36px_rgb(255_77_99/0.28)]">{title}</h2>
      <span aria-hidden="true" className="mt-4 block h-1.5 w-28 -skew-x-12 bg-accent-bright shadow-[0_0_22px_var(--color-accent-bright)]" />
      {note && <p className="m-0 mt-3 max-w-prose text-text-secondary">{note}</p>}
    </header>
  );
}
