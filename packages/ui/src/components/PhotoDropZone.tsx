// Drop many photos at once, or pick them (PRD §8, §9). Dropping is a shortcut; the button is the
// way that works with a keyboard and on phones.
import { ImagePlus } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import { Button } from "./Button";

export function PhotoDropZone({ onFiles, label = "Drop photos here" }: { onFiles: (files: File[]) => void; label?: string }) {
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
      className={`${over ? "bg-surface-hover" : "bg-surface"} corner-marks flex flex-col items-center gap-3 rounded-card p-8 text-center`}
    >
      <ImagePlus aria-hidden="true" size={32} strokeWidth={1.5} className="text-text-secondary" />
      <p className="m-0 text-sm text-text-secondary">{label}, or</p>
      <Button onClick={() => input.current?.click()}>Choose photos…</Button>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => {
        const files = images(e.target.files);
        if (files.length) onFiles(files);
        e.target.value = ""; // the same files can be picked again
      }} />
    </div>
  );
}
