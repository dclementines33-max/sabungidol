// The broadcast overlay: lap + clock, the position tower with gaps, laps won (one lap = one game), the start lights,
// short banners (LAP 2, PHOTO FINISH…) and the result card. Plain DOM, redrawn from the race state.
import { LAPS } from "./race.js";

const $ = (id) => document.getElementById(id);
export const COLORS = ["#ff4d63", "#9fd8ff"];

export function createHud(players, track) {
  let bannerTimer = 0;
  return {
    update(race) {
      const { state } = race;
      const lead = race.order()[0];
      $("lap").textContent = `Lap ${Math.min(LAPS, lead.laps.length + 1)} / ${LAPS}`;
      $("clock").textContent = state.t.toFixed(2);
      $("tower").innerHTML = race.order().map((m, i, all) => {
        const gap = i === 0 ? "Leader" : gapText(race, all[0], m, track.step);
        return `<li style="--c:${COLORS[m.k]}"><span class="pos">${i + 1}</span><span class="dot"></span><span class="name">${players[m.k].name}</span><span class="gap">${gap}</span></li>`;
      }).join("");
      const score = race.score();
      $("laps").innerHTML = `<span class="score" style="color:${COLORS[0]}">${score[0]}</span>`
        + Array.from({ length: LAPS }, (_, i) => { const w = state.lapWinners[i]; return `<span class="chip" style="--c:${w === undefined ? "#333" : COLORS[w]}">Lap ${i + 1}</span>`; }).join("")
        + `<span class="score" style="color:${COLORS[1]}">${score[1]}</span>`;
    },
    lights(n) { // n lit (0–5); -1 hides them
      $("lights").hidden = n < 0;
      [...$("lights").children].forEach((s, i) => s.classList.toggle("on", i < n));
    },
    banner(text, ms = 1600) {
      clearTimeout(bannerTimer);
      $("banner").textContent = text; $("banner").hidden = false;
      bannerTimer = setTimeout(() => { $("banner").hidden = true; }, ms);
    },
    result(race, onAgain) {
      const score = race.score(), w = score[0] > score[1] ? 0 : 1, p = players[w];
      const total = (m) => (m.laps.at(-1) ?? 0).toFixed(2);
      $("result").innerHTML = `<div class="card" style="--c:${COLORS[w]}">
        <p class="kicker">Winner · ${score[w]}–${score[1 - w]} in laps</p>
        ${p.photo ? `<img src="${p.photo}" alt="">` : ""}
        <h2>${p.name}</h2>
        <p class="final"><span style="color:${COLORS[0]}">${score[0]}</span> – <span style="color:${COLORS[1]}">${score[1]}</span></p>
        <table><tbody>${race.state.lapWinners.map((k, i) => `<tr><td>Lap ${i + 1}</td><td style="color:${COLORS[k]}">${players[k].name}</td><td>${race.state.marbles[k].laps[i].toFixed(2)}s</td></tr>`).join("")}
          ${race.state.marbles.map((m) => `<tr><td>Finish</td><td style="color:${COLORS[m.k]}">${players[m.k].name}</td><td>${total(m)}s${m.respawns ? ` · ${m.respawns} fall${m.respawns > 1 ? "s" : ""}` : ""}</td></tr>`).join("")}</tbody></table>
        <p class="kicker" style="margin-top:12px;color:var(--muted)">Nothing is saved: in the app only this score would go back to the match.</p>
        <div class="actions"><button class="primary" id="again">New race</button><button id="close">Close</button></div>
      </div>`;
      $("result").hidden = false;
      $("again").onclick = () => { $("result").hidden = true; onAgain(); };
      $("close").onclick = () => { $("result").hidden = true; };
    },
  };
}

// Gap to the leader: seconds once the leader has crossed a lap line the other has not, metres on the same lap.
function gapText(race, lead, m, step) {
  const dl = lead.laps.length - m.laps.length;
  if (dl > 0) return `+${(race.state.t - lead.laps[m.laps.length]).toFixed(2)}s`; // time since the leader crossed that lap line
  if (lead.phase === "done" && m.phase === "done") return `+${(m.laps.at(-1) - lead.laps.at(-1)).toFixed(2)}s`;
  const metres = (race.progress(lead) - race.progress(m)) * step;
  return `+${metres.toFixed(1)} m`;
}
