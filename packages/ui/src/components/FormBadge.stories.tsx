import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormBadge } from "./FormBadge";

const meta: Meta<typeof FormBadge> = {
  title: "Display/FormBadge",
  component: FormBadge,
  args: { form: "On Fire", recent: ["W", "W", "W", "W", "W"] },
};
export default meta;
type Story = StoryObj<typeof FormBadge>;

export const Single: Story = {};
export const EveryForm: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <FormBadge form="On Fire" recent={["W", "W", "W", "W", "W"]} />
      <FormBadge form="Hot Streak" recent={["W", "D", "W", "W", "W"]} />
      <FormBadge form="Confident" recent={["W", "W", "L", "D", "W"]} />
      <FormBadge form="Steady" recent={["W", "L", "D", "L", "W"]} />
      <FormBadge form="Cold Slump" recent={["L", "L", "D", "L", "W"]} />
    </div>
  ),
};
