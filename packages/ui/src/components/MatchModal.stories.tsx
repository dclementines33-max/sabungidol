import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { MatchModal } from "./MatchModal";
import { SampleIdols } from "./sampleIdols";

const meta: Meta = { title: "Match/MatchModal", decorators: [(Story) => <SampleIdols><Story /></SampleIdols>] };
export default meta;

function Example({ bestOf, grandFinal = false }: { bestOf: 4 | 5 | 7; grandFinal?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open match</Button>
      <MatchModal
        open={open}
        onOpenChange={setOpen}
        title={bestOf === 4 ? "League D1A · Matchday 17" : grandFinal ? "Unzure Cup · Final" : "Unzure Cup · R32 · Match 4"}
        idolA="mina"
        idolB="sora"
        bestOf={bestOf}
        h2h={{ winsA: 3, draws: 1, winsB: 2 }}
        theme={grandFinal ? { grandFinal: true } : undefined}
        onAccept={() => {}}
      />
    </>
  );
}

export const KnockoutBo5: StoryObj = { render: () => <Example bestOf={5} /> };
export const LeagueBo4: StoryObj = { render: () => <Example bestOf={4} /> };
export const GrandFinalBo7: StoryObj = { render: () => <Example bestOf={7} grandFinal /> };
