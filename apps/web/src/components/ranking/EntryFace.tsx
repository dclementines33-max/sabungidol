// An idol's or a girl group's picture: the idol's photo, or for a group its best member's photo with the group logo pinned
// to the corner (or the group's initials when it has no members' photo).
import { IdolPhoto } from "@sabung/ui";
import { CompetitionLogo } from "../CompetitionLogo";
import type { Entry } from "./useEntries";

export function EntryFace({ entry, size = 256, className = "w-16", logo = "size-7" }: { entry: Entry; size?: 256 | 1024; className?: string; logo?: string }) {
  const isGroup = entry.id === entry.groupId;
  return (
    <span className={`relative block shrink-0 ${className}`}>
      {entry.face
        ? <IdolPhoto idolId={entry.face} size={size} className="w-full" />
        : <span className="grid aspect-[3/4] w-full place-items-center bg-stage-hi font-gothic text-xl">{entry.name.slice(0, 2)}</span>}
      {isGroup && entry.logoId && (
        <span className="absolute -right-1 -bottom-1 rounded-control bg-bg-base/85 p-0.5 shadow-[0_0_0_1px_var(--color-border)]"><CompetitionLogo logoId={entry.logoId} className={logo} /></span>
      )}
    </span>
  );
}
