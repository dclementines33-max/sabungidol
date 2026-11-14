// Season Recap card (PRD §16): a 1080 × 1350 image of every champion of a season, drawn on a canvas in the browser
// (nothing leaves the device). The Unzure champion is the cover; every other title sits in a list below.
export type RecapEntry = { key: string; label: string; name: string; group: string | null; photo: ImageBitmap | null };

const W = 1080;
const H = 1350;
const ORDER = ["UZC", "DSG", "IDL", "IDL-PO", "INK", "NUG"];

// Unzure first, then the big cups, then the rest by key (leagues, B-Side, Music Bank).
export function recapOrder(keys: string[]): string[] {
  return [...keys].sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
}

function cover(ctx: CanvasRenderingContext2D, img: ImageBitmap, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

export function drawRecap(canvas: HTMLCanvasElement, seasonName: string, entries: RecapEntry[]) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const bg = ctx.createRadialGradient(W * 0.8, H * 0.2, 50, W * 0.8, H * 0.2, 900);
  bg.addColorStop(0, "#7a0f22");
  bg.addColorStop(1, "#07060a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const font = (weight: number, size: number) => `${weight} ${size}px "Archivo Variable", "Archivo", sans-serif`;

  ctx.fillStyle = "#ff4d63";
  ctx.font = font(800, 28);
  ctx.fillText("SABUNG IDOL · SEASON RECAP", 60, 80);
  ctx.fillStyle = "#e8eef5";
  ctx.font = font(800, 96);
  ctx.fillText(seasonName.toUpperCase(), 60, 180);

  const [top, ...rest] = entries;
  if (top) {
    if (top.photo) cover(ctx, top.photo, 60, 230, 400, 500);
    ctx.fillStyle = "#ff4d63";
    ctx.font = font(800, 26);
    ctx.fillText(top.label.toUpperCase(), 500, 300);
    ctx.fillStyle = "#e8eef5";
    ctx.font = font(800, 72);
    ctx.fillText(top.name.toUpperCase(), 500, 380, 540);
    ctx.fillStyle = "#9fb0c2";
    ctx.font = font(500, 30);
    ctx.fillText(top.group ?? "Soloist", 500, 430);
  }

  const rowH = 46;
  rest.slice(0, 12).forEach((e, i) => {
    const col = i < 6 ? 0 : 1;
    const y = 800 + (i % 6) * (rowH + 32);
    const x = 60 + col * 500;
    if (e.photo) cover(ctx, e.photo, x, y - 36, 48, 60);
    ctx.fillStyle = "#9fb0c2";
    ctx.font = font(700, 18);
    ctx.fillText(e.label.toUpperCase(), x + 64, y - 14, 400);
    ctx.fillStyle = "#e8eef5";
    ctx.font = font(800, 30);
    ctx.fillText(e.name, x + 64, y + 20, 400);
  });
  if (rest.length > 12) {
    ctx.fillStyle = "#9fb0c2";
    ctx.font = font(500, 22);
    ctx.fillText(`+${rest.length - 12} more titles`, 60, H - 50);
  }
}
