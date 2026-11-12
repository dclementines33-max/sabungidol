import { matchRng, simulateSeries } from "@sabung/engine";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { LiveMatchVisualizer } from "./LiveMatchVisualizer";
import { MatchModal } from "./MatchModal";
import { SampleIdols } from "./sampleIdols";

const meta: Meta = { title: "Match/MatchModal", decorators: [(Story) => <SampleIdols><Story /></SampleIdols>] };
export default meta;

function Example({ bestOf }: { bestOf: 4 | 5 }) {
  const [open, setOpen] = useState(true);
  const [run, setRun] = useState(0);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Buka match</Button>
      <MatchModal
        open={open}
        onOpenChange={setOpen}
        title={bestOf === 4 ? "Liga D1-A · Matchday 17" : "Unzure Cup · R32 · Match 4"}
        idolA="mina"
        idolB="sora"
        bestOf={bestOf}
        h2h={{ winsA: 3, draws: 1, winsB: 2 }}
        simulate={() => {
          setRun((r) => r + 1);
          return simulateSeries({ ratingA: 92, ratingB: 76, bestOf, rng: matchRng("story", `run${run}`) }).games;
        }}
        onAccept={() => {}}
      />
    </>
  );
}

export const KnockoutBo5: StoryObj = { render: () => <Example bestOf={5} /> };
export const LeagueBo4: StoryObj = { render: () => <Example bestOf={4} /> };

export const ComebackReplay: StoryObj = {
  render: () => <div className="max-w-md"><LiveMatchVisualizer games={["B", "B", "A", "A", "A"]} nameA="Mina Kim" nameB="Han Sora" /></div>,
};
