import { checkGroups, drawGroups, matchRng } from "@sabung/engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { IdolSourceProvider } from "./idolSource";
import { ManualGroupModal } from "./ManualDrawModal";

const meta: Meta = { title: "Dialogs/ManualGroupModal" };
export default meta;

// A real draw from the engine: 64 idols, 4 pots, 20 girl groups, 6 leagues.
const colors = ["brand-rose", "brand-indigo", "brand-teal", "brand-amber", "brand-violet"];
const idols = Array.from({ length: 64 }, (_, k) => ({ id: `i${k}`, league: `D1${"ABCDEF"[k % 6]}`, groupId: k < 50 ? `g${k % 20}` : null }));
const pots = [0, 1, 2, 3].map((p) => idols.slice(p * 16, p * 16 + 16));
const byId = new Map(idols.map((i) => [i.id, i]));
const source = {
  idol: (id: string) => {
    const i = byId.get(id);
    return i && { id, name: `Idol ${id.slice(1).padStart(2, "0")}`, groupName: i.groupId, groupColor: colors[Number(id.slice(1)) % 5], rating: 70 };
  },
  photo: () => undefined,
};
const groups = drawGroups(pots, matchRng("story", "draw")).groups.map((g) => g.map((x) => x.id));
const check = (columns: string[][]) => checkGroups(columns.map((c) => c.map((id) => byId.get(id)!)), (id) => Math.floor(Number(id.slice(1)) / 16));

function Example() {
  const [open, setOpen] = useState(true);
  return (
    <IdolSourceProvider source={source}>
      <Button onClick={() => setOpen(true)}>Atur grup</Button>
      <ManualGroupModal open={open} onOpenChange={setOpen} groups={groups} check={check} onApply={() => {}} />
    </IdolSourceProvider>
  );
}

export const SixteenGroups: StoryObj = { render: () => <Example /> };
