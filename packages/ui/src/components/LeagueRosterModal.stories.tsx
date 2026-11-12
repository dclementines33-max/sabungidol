import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { IdolSourceProvider, type IdolInfo } from "./idolSource";
import { LeagueRosterModal } from "./LeagueRosterModal";

const meta: Meta = { title: "Dialogs/LeagueRosterModal" };
export default meta;

const colors = ["brand-rose", "brand-indigo", "brand-teal", "brand-amber"];
const idols: IdolInfo[] = Array.from({ length: 26 }, (_, i) => ({
  id: `i${i}`,
  name: `Idol ${String(i + 1).padStart(2, "0")}`,
  groupName: `Group ${(i % 4) + 1}`,
  groupColor: colors[i % 4],
  rating: 60 + ((i * 7) % 35),
}));
const byId = new Map(idols.map((i) => [i.id, i]));
const roster = idols.slice(0, 19).map((i) => i.id); // one short, so the counter shows the problem

function Example() {
  const [open, setOpen] = useState(true);
  return (
    <IdolSourceProvider source={{ idol: (id) => byId.get(id), photo: () => undefined }}>
      <Button onClick={() => setOpen(true)}>Roster D1A</Button>
      <LeagueRosterModal
        open={open}
        onOpenChange={setOpen}
        league="D1A"
        roster={roster}
        idolIds={idols.map((i) => i.id)}
        leagueOf={(id) => (id === "i22" ? "D2C" : roster.includes(id) ? "D1A" : null)}
        onApply={() => {}}
      />
    </IdolSourceProvider>
  );
}

export const OneShort: StoryObj = { render: () => <Example /> };
