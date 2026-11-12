import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatTile } from "./StatTile";

const meta: Meta<typeof StatTile> = { title: "Display/StatTile", component: StatTile, args: { label: "Matches saved", value: "5,590", delta: 130 } };
export default meta;
type Story = StoryObj<typeof StatTile>;

export const Up: Story = {};
export const Down: Story = { args: { label: "Rating", value: 84, delta: -3 } };
export const NoChange: Story = { args: { label: "Titles", value: 7, delta: 0 } };
