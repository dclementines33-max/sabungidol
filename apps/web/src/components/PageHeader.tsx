// An editorial page opener (redesign brief; Update 2 polish): tag, a big headline, one line of explanation, and the
// page's word again as a giant outline behind. The shell's own <h1> keeps the panel name.
export function PageHeader({ tag, title, note }: { tag: string; title: string; note?: string }) {
  return (
    <header className="relative isolate overflow-hidden pt-2">
      <p aria-hidden="true" className="outline-text pointer-events-none absolute -top-2 right-0 -z-10 m-0 font-display text-ornament leading-none whitespace-nowrap opacity-30">{tag}</p>
      <p className="m-0"><span className="tag">{tag}</span></p>
      <h2 className="m-0 mt-3 max-w-[18ch] text-hero">{title}</h2>
      {note && <p className="m-0 mt-2 max-w-prose text-text-secondary">{note}</p>}
    </header>
  );
}
