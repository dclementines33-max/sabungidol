// Drag and drop for My Top 10 and the tier lists (2026-11-17), with pointer events so it works with a mouse, a pen and a
// finger: a mouse drag starts after 4 px, a finger after holding still for 0.22 s (a quick swipe still scrolls the page).
// Drop zones carry data-drop="<id>" (data-drop-axis="y" for a vertical list); items inside carry data-drag-index="<n>".
// A click without a drag still reaches the item, so tap-to-select keeps working.
import { type MouseEvent, type PointerEvent as ReactPointerEvent, useRef, useState } from "react";

export type DragState = { id: string; x: number; y: number; over: string | null };
type Hit = { target: string; index: number | null };

const blockScroll = (e: TouchEvent) => e.preventDefault();
const EDGE = 70; // px from the window edge where a drag scrolls the page

export function hitTest(x: number, y: number): Hit | null {
  const el = document.elementFromPoint(x, y);
  const zone = el?.closest<HTMLElement>("[data-drop]");
  if (!zone) return null;
  const item = el?.closest<HTMLElement>("[data-drag-index]");
  if (!item || !zone.contains(item)) return { target: zone.dataset.drop!, index: null };
  const r = item.getBoundingClientRect();
  const after = zone.dataset.dropAxis === "y" ? y > r.top + r.height / 2 : x > r.left + r.width / 2;
  return { target: zone.dataset.drop!, index: Number(item.dataset.dragIndex) + (after ? 1 : 0) };
}

export function usePointerDrag(onDrop: (id: string, target: string, index: number | null) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const dragged = useRef(false);

  const bind = (id: string) => ({
    onPointerDown(e: ReactPointerEvent) {
      if (e.button !== 0) return;
      const x0 = e.clientX, y0 = e.clientY, touch = e.pointerType !== "mouse";
      let started = false;
      const show = (x: number, y: number) => setDrag({ id, x, y, over: hitTest(x, y)?.target ?? null });
      const begin = (x: number, y: number) => {
        started = true;
        window.addEventListener("touchmove", blockScroll, { passive: false });
        navigator.vibrate?.(8);
        show(x, y);
      };
      const hold = touch ? window.setTimeout(() => begin(x0, y0), 220) : 0;
      const end = () => {
        window.clearTimeout(hold);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", end);
        window.removeEventListener("touchmove", blockScroll);
        setDrag(null);
      };
      const move = (ev: PointerEvent) => {
        if (!started) {
          const far = Math.hypot(ev.clientX - x0, ev.clientY - y0);
          if (touch) { if (far > 10) end(); return; } // the finger moved first: a scroll
          if (far < 4) return;
          begin(ev.clientX, ev.clientY);
        }
        show(ev.clientX, ev.clientY);
        if (ev.clientY < EDGE) window.scrollBy(0, -14);
        else if (ev.clientY > window.innerHeight - EDGE) window.scrollBy(0, 14);
      };
      const up = (ev: PointerEvent) => {
        if (started) {
          const hit = hitTest(ev.clientX, ev.clientY);
          if (hit) dropRef.current(id, hit.target, hit.index);
          dragged.current = true; // swallow the click that follows the drop
          window.setTimeout(() => { dragged.current = false; }, 0);
        }
        end();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", end);
    },
    onClickCapture(e: MouseEvent) {
      if (dragged.current) { e.preventDefault(); e.stopPropagation(); }
    },
    onContextMenu: (e: MouseEvent) => e.preventDefault(), // a long press must not open the phone's image menu
    onDragStart: (e: MouseEvent) => e.preventDefault(), // the browser's own drag of a photo or link would cancel ours
  });

  return { drag, bind };
}
