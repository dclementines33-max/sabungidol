import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { ImportDialog } from "./ImportDialog";

const meta: Meta = { title: "Dialogs/ImportDialog" };
export default meta;

function Example({ fails }: { fails?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Import roster</Button>
      <ImportDialog
        open={open}
        onOpenChange={setOpen}
        title="Import roster liga"
        accept=".csv,.json,.sabung"
        readFile={async () => {
          if (fails) throw new Error("Backup dari versi lebih baru (skema 5); aplikasi ini memakai skema 3.");
          return { added: 238, replaced: 2, conflicts: ["Mina (Aurora): rating 92 → 88", "Yuna (Aurora): seed 2 → 1"], unknown: ["Minah", "Sora H."] };
        }}
        onApply={() => {}}
      />
    </>
  );
}

export const PickAFile: StoryObj = { render: () => <Example /> };
export const NewerBackup: StoryObj = { render: () => <Example fails /> };
