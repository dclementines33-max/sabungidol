// Warnings and errors stay above the content until the user closes them (PRD §14.1).
import { Banner, Button, ErrorPanel } from "@sabung/ui";
import { useNotices } from "../../data/notices";

export function PinnedNotices() {
  const pinned = useNotices((s) => s.pinned);
  const unpin = useNotices((s) => s.unpin);
  if (pinned.length === 0) return null;
  return (
    <div className="mb-4 space-y-2">
      {pinned.map((notice) => notice.level === "error"
        ? (
          <div key={notice.id} className="space-y-1">
            <ErrorPanel
              code={notice.code ?? "E-UNKNOWN"}
              message={notice.message}
              context={notice.context}
              report={[notice.code, notice.message, notice.context, notice.at].filter(Boolean).join("\n")}
            />
            <Button className="px-2 py-1" onClick={() => unpin(notice.id)}>Dismiss</Button>
          </div>
        )
        : <Banner key={notice.id} notice={notice} action={<Button className="px-2 py-1" onClick={() => unpin(notice.id)}>Dismiss</Button>} />)}
    </div>
  );
}
