// The arenas, and a match's draw: every game of a match gets a different one, in a random order.
import busan from "./busan.js";
import cascade from "./cascade.js";
import frost from "./frost.js";
import jeju from "./jeju.js";
import kings from "./kings.js";
import seoul from "./seoul.js";
import split from "./split.js";
import tokyo from "./tokyo.js";

export const ARENAS = [seoul, busan, tokyo, frost, jeju, kings, split, cascade];

// A shuffled order of all arenas for one match (Bo7 uses seven different ones).
export function drawArenas(rand) {
  const order = [...ARENAS];
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}
