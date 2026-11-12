import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { SAMPLE_IDOLS, SampleIdols } from "./sampleIdols";
import { SearchableIdolSelect } from "./SearchableIdolSelect";

const meta: Meta = { title: "Inputs/SearchableIdolSelect", decorators: [(Story) => <SampleIdols><Story /></SampleIdols>] };
export default meta;

function HeadToHeadPickers() {
  const [a, setA] = useState<string | null>("mina");
  const [b, setB] = useState<string | null>(null);
  const ids = SAMPLE_IDOLS.map((i) => i.id);
  return (
    <div className="grid max-w-xl grid-cols-2 gap-4">
      <SearchableIdolSelect label="Idol A" idolIds={ids} value={a} onChange={setA} />
      <SearchableIdolSelect label="Idol B" idolIds={ids.filter((id) => id !== a)} value={b} onChange={setB} />
    </div>
  );
}

export const TwoIdols: StoryObj = { render: () => <HeadToHeadPickers /> };
