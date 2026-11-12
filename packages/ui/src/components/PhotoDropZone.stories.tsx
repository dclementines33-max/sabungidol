import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhotoDropZone } from "./PhotoDropZone";

const meta: Meta<typeof PhotoDropZone> = { title: "Input/PhotoDropZone", component: PhotoDropZone, args: { onFiles: () => {} } };
export default meta;

export const Default: StoryObj<typeof PhotoDropZone> = {};
