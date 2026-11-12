// Drop many photos at once, or pick them (PRD §8, §9). Dropping is a shortcut; the button is the
// way that works with a keyboard and on phones.
import { ImagePlus } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import { Button } from "./Button";

export function PhotoDropZone({ onFiles, label = "Seret foto ke sini" }: { onFiles: (files: File[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const images = (list: FileList | null) => [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
  const drop = (event: DragEvent) => {
    event.preventDefault();
    setOver(false);
    const files = images(event.dataTransfer.files);
    if (files.length) onFiles(files);
  };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={`${over ? "border-accent-bright bg-surface-hover" : "border-border-strong bg-surface"} flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-8 text-center`}
    >
      <ImagePlus aria-hidden="true" size={32} strokeWidth={1.5} className="text-text-secondary" />
      <p className="m-0 text-sm text-text-secondary">{label}, atau</p>
      <Button onClick={() => input.current?.click()}>Pilih foto…</Button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => {
        const files = images(e.target.files);
        if (files.length) onFiles(files);
        e.target.value = ""; // the same files can be picked again
      }} />
    </div>
  );
}
