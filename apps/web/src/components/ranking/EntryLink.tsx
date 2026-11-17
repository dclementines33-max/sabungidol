// An entry's name as a link: an idol to her profile, a girl group to its page.
import { Link } from "@tanstack/react-router";
import type { Entry } from "./useEntries";

const style = "text-text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-bright";

export function EntryLink({ entry, className = "" }: { entry: Entry; className?: string }) {
  return entry.id === entry.groupId
    ? <Link to="/wiki/group/$id" params={{ id: entry.id }} className={`${style} ${className}`}>{entry.name}</Link>
    : <Link to="/wiki/idols/$id" params={{ id: entry.id }} className={`${style} ${className}`}>{entry.name}</Link>;
}
