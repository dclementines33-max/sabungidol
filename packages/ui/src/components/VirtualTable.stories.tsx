import type { Meta, StoryObj } from "@storybook/react-vite";
import { RatingBadge } from "./RatingBadge";
import { VirtualTable } from "./VirtualTable";

type Row = { id: string; name: string; rating: number };
const rows: Row[] = Array.from({ length: 10_000 }, (_, i) => ({ id: `m${i}`, name: `Match ${i + 1}`, rating: 40 + (i * 7) % 60 }));

const meta: Meta = { title: "Data/VirtualTable" };
export default meta;

export const TenThousandRows: StoryObj = {
  render: () => (
    <VirtualTable<Row>
      rows={rows}
      rowKey={(r) => r.id}
      label="Match"
      height="400px"
      columns={[
        { header: "#", cell: (r) => r.id.slice(1), className: "w-16 font-mono tabular-nums" },
        { header: "Nama", cell: (r) => r.name },
        { header: "Rating", cell: (r) => <RatingBadge rating={r.rating} /> },
      ]}
    />
  ),
};
