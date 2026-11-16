// "Back up to cloud" runs here, not in the Settings panel: leaving the panel unmounts it, but the upload goes on, its
// progress stays visible when the panel comes back, and a second upload can't start on top of it.
import type { BackupSection } from "@sabung/shared";
import { create } from "zustand";
import { uploadCloudBackup } from "./cloudApi";
import { engine } from "./engineClient";
import { notify } from "./notices";
import { queryClient } from "./queryClient";

export const useCloudUpload = create<{ status: string }>(() => ({ status: "" })); // "" = no upload running
const mb = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`;

export async function backUpToCloud(section: BackupSection, seasonId?: string) {
  if (useCloudUpload.getState().status) return;
  const show = (status: string) => useCloudUpload.setState({ status });
  show("Preparing backup…");
  try {
    const { bytes, name } = await engine().exportBackup(section, seasonId);
    show(`Uploading 0 of ${mb(bytes.byteLength)}…`);
    await uploadCloudBackup(bytes, name, (sent, total) => show(`Uploading ${mb(sent)} of ${mb(total)}…`));
    notify({ level: "success", message: `Backup uploaded to the cloud (${mb(bytes.byteLength)})` });
    await queryClient.invalidateQueries({ queryKey: ["cloud-backups"] });
  } catch (error) {
    notify({ level: "error", code: "E-CLOUD-001", message: "Cloud upload failed.", context: error instanceof Error ? error.message : String(error) });
  } finally {
    show("");
  }
}
