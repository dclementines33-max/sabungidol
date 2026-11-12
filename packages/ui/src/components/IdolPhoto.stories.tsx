import type { Meta, StoryObj } from "@storybook/react-vite";
import { IdolPhoto } from "./IdolPhoto";
import { SAMPLE_IDOLS, SampleIdols } from "./sampleIdols";

const meta: Meta<typeof IdolPhoto> = {
  title: "Display/IdolPhoto",
  component: IdolPhoto,
  args: { idolId: "mina", size: 256, className: "w-48" },
  decorators: [(Story) => <SampleIdols><Story /></SampleIdols>],
};
export default meta;
type Story = StoryObj<typeof IdolPhoto>;

export const Placeholder: Story = {};
export const ListSize: Story = {
  render: () => <div className="flex gap-2">{SAMPLE_IDOLS.map((i) => <IdolPhoto key={i.id} idolId={i.id} size={64} />)}</div>,
};
