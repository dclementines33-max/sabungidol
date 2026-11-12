import type { Meta, StoryObj } from "@storybook/react-vite";
import { RatingBadge } from "./RatingBadge";

const meta: Meta<typeof RatingBadge> = { title: "Display/RatingBadge", component: RatingBadge, args: { rating: 92 } };
export default meta;
type Story = StoryObj<typeof RatingBadge>;

export const Single: Story = {};
export const EveryTier: Story = {
  render: () => <div className="flex gap-2">{[95, 85, 75, 65, 52].map((r) => <RatingBadge key={r} rating={r} />)}</div>,
};
