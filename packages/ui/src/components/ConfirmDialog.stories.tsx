import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";
import { ResetSeasonModal } from "./ResetSeasonModal";

const meta: Meta = { title: "Dialogs/ConfirmDialog" };
export default meta;

function Opener({ label, children }: { label: string; children: (open: boolean, set: (o: boolean) => void) => React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      {children(open, setOpen)}
    </>
  );
}

export const Standard: StoryObj = {
  render: () => (
    <Opener label="Simpan rating">
      {(open, set) => <ConfirmDialog open={open} onOpenChange={set} title="Simpan perubahan rating?" message="12 idol berubah rating." confirmLabel="Save Now" onConfirm={() => {}} />}
    </Opener>
  ),
};

export const TypeToConfirm: StoryObj = {
  render: () => (
    <Opener label="Hapus semua data">
      {(open, set) => (
        <ConfirmDialog open={open} onOpenChange={set} title="Hapus semua data?" message="Semua idol, season dan match akan hilang." confirmLabel="Hapus semua" danger typeToConfirm="HAPUS" onConfirm={() => {}} />
      )}
    </Opener>
  ),
};

export const ResetSeason: StoryObj = {
  render: () => (
    <Opener label="Reset season">
      {(open, set) => <ResetSeasonModal open={open} onOpenChange={set} seasonName="Season 3" matchCount={5590} competitionCount={9} onReset={() => {}} />}
    </Opener>
  ),
};
