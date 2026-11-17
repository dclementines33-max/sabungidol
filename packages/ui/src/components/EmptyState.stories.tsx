import type { Meta, StoryObj } from "@storybook/react-vite";
import { Users } from "../icons";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "Display/EmptyState",
  component: EmptyState,
  args: {
    icon: Users,
    title: "Belum ada idol",
    description: "Tambahkan 240 idol lewat Input Data untuk mulai season pertama.",
  },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};
