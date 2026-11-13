// Input Data (PRD §8): add idols (paste, file, form), their photos, and per-idol actions.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AddIdols } from "../../components/inputData/AddIdols";
import { IdolActions } from "../../components/inputData/IdolActions";
import { PhotoImport } from "../../components/inputData/PhotoImport";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { PageHeader } from "../../components/PageHeader";

export const Route = createFileRoute("/studio/input")({ component: InputData });

function InputData() {
  const { data: idols = [], isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  if (isPending) return <p className="text-text-secondary">Membaca database…</p>;
  return (
    <div className="space-y-10">
      <PageHeader tag="Input Data" title="Tambah dan rapikan idol" note="Tambah idol satu per satu atau sekaligus, unggah foto, lalu edit atau hapus." />
      <AddIdols idols={idols} />
      <PhotoImport idols={idols} />
      <IdolActions idols={idols} />
    </div>
  );
}
