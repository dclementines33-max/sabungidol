import type { Meta, StoryObj } from "@storybook/react-vite";
import { IdolCard } from "./IdolCard";
import { SAMPLE_IDOLS, SampleIdols } from "./sampleIdols";

const meta: Meta<typeof IdolCard> = {
  title: "Display/IdolCard",
  component: IdolCard,
  args: { idolId: "mina" },
  decorators: [(Story) => <SampleIdols><Story /></SampleIdols>],
};
export default meta;
type Story = StoryObj<typeof IdolCard>;

export const Single: Story = {};
export const Grid: Story = {
  render: () => <div className="flex flex-wrap gap-4">{SAMPLE_IDOLS.map((i) => <IdolCard key={i.id} idolId={i.id} />)}</div>,
};
