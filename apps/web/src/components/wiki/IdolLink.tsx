// An idol's name as a link to their profile (PRD §8: every name in the wiki leads to the idol).
import { useIdol } from "@sabung/ui";
import { Link } from "@tanstack/react-router";

export function IdolLink({ id, className = "" }: { id: string; className?: string }) {
  return <Link to="/wiki/idols/$id" params={{ id }} className={`text-text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent-bright ${className}`}>{useIdol(id).name}</Link>;
}
