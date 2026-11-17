// Task 3 check (not in the menu): the whole icon kit large and small, plain and as .icon-tone, to judge it by eye.
import * as icons from "@sabung/ui/icons";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dev/icons")({ component: IconSheet });

const ALL = Object.entries(icons) as [string, icons.Icon][];

function IconSheet() {
  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3 p-0">
      {ALL.map(([name, Icon]) => (
        <li key={name} className="panel flex flex-col items-center gap-2 p-3">
          <Icon size={56} strokeWidth={1.5} />
          <span className="flex items-center gap-2"><Icon size={18} strokeWidth={1.5} /><Icon size={24} className="icon-tone text-accent-bright" /></span>
          <span className="kicker text-text-secondary">{name}</span>
        </li>
      ))}
    </ul>
  );
}
