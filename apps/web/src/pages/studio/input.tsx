// Input Data (PRD §8): add idols (paste, file, form), their photos, and per-idol actions.
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AddIdols } from "../../components/inputData/AddIdols";
import { GalleryImport } from "../../components/inputData/GalleryImport";
import { IdolActions } from "../../components/inputData/IdolActions";
import { IdolDetailsImport } from "../../components/inputData/IdolDetailsImport";
import { PhotoImport } from "../../components/inputData/PhotoImport";
import { engine } from "../../data/engineClient";
import { IDOLS_QUERY } from "../../data/IdolDataProvider";
import { PageHeader } from "../../components/PageHeader";

export const Route = createFileRoute("/studio/input")({ component: InputData });

function InputData() {
  const { data: idols = [], isPending } = useQuery({ queryKey: IDOLS_QUERY, queryFn: () => engine().listIdols(), enabled: typeof Worker !== "undefined" });
  if (isPending) return <p className="text-text-secondary">Loading database…</p>;
  return (
    <div className="studio-flow space-y-10">
      <PageHeader tag="Input Data" title="Add and tidy up idols" note="Add idols one by one or in bulk, upload photos, then edit or delete." />
      <AddIdols idols={idols} />
      <PhotoImport idols={idols} />
      <GalleryImport idols={idols} />
      <IdolDetailsImport />
      <IdolActions idols={idols} />
    </div>
  );
}
