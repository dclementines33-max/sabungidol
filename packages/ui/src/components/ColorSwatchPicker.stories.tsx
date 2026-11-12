import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ColorSwatchPicker } from "./ColorSwatchPicker";

const meta: Meta = { title: "Input/ColorSwatchPicker" };
export default meta;

export const Default: StoryObj = {
  render: () => {
    const [value, setValue] = useState<string>("brand-rose");
    return <ColorSwatchPicker label="Warna aksen" value={value} onChange={setValue} />;
  },
};
