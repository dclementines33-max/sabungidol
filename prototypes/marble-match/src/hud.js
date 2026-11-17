// The broadcast overlay: arena + game + clock, the standing (race gaps, or sumo "in / out"), the series bar (one chip
// per game: its arena and who won it), the intro card before each game, the start lights, banners and the match result.
import { seriesState, seriesTarget } from "./match.js";

const $ = (id) => document.getElementById(id);
export const COLORS = ["#ff4d63", "#9fd8ff"];
const SIDE = { A: 0, B: 1 };

export function createHud(players) {
  let bannerTimer = 0;
  const name = (k) => players[k].name;
  return {
    arena(match, g) {
      const a = match.arenas[g];
      $("arena-name").textContent = a.name;
      $("arena-tag").textContent = `Game ${g + 1} · Bo${match.bestOf} · ${a.tagline}`;
    },
    update(game) {
      $("clock").textContent = game.state.t.toFixed(2);
      $("tower").innerHTML = game.order().map((m, i, all) => {
        const note = game.sumo ? (m.out !== null ? "Out" : "In the ring") : i === 0 ? (m.finished !== null ? "Winner" : "Leader") : m.finished !== null ? `+${(m.finished - all[0].finished).toFixed(2)}s` : `+${Math.max(0, all[0].prog - m.prog).toFixed(1)} m`;
        return `<li style="--c:${COLORS[m.k]}"><span class="pos">${i + 1}</span><span class="dot"></span><span class="name">${name(m.k)}</span><span class="gap">${note}</span></li>`;
      }).join("");
    },
    series(match, current = -1) {
      const s = seriesState(match.bestOf, match.games);
      const shown = Math.max(match.games.length + (s.result ? 0 : 1), seriesTarget(match.bestOf));
      $("series").innerHTML = `<span class="score" style="color:${COLORS[0]}">${s.a}</span>`
        + Array.from({ length: Math.min(match.bestOf, shown) }, (_, g) => {
          const w = match.games[g];
          return `<span class="chip ${g === current ? "now" : ""}" style="--c:${w ? COLORS[SIDE[w]] : "#333"}" title="${match.arenas[g].name}">G${g + 1}<small>${match.arenas[g].name.split(" ")[0]}</small></span>`;
        }).join("")
        + `<span class="score" style="color:${COLORS[1]}">${s.b}</span>`;
    },
    intro(match, g, show) {
      const a = match.arenas[g];
      $("intro").hidden = !show;
      if (show) $("intro").innerHTML = `<p class="kicker">Game ${g + 1} of Bo${match.bestOf}</p><h2>${a.name}</h2><p>${a.tagline}</p>`;
    },
    lights(n) { $("lights").hidden = n < 0; [...$("lights").children].forEach((s, i) => s.classList.toggle("on", i < n)); },
    banner(text, ms = 1600) {
      clearTimeout(bannerTimer);
      $("banner").textContent = text; $("banner").hidden = false;
      bannerTimer = setTimeout(() => { $("banner").hidden = true; }, ms);
    },
    result(match, onAgain) {
      const s = seriesState(match.bestOf, match.games);
      const w = s.result === "D" ? null : SIDE[s.result], p = w === null ? null : players[w];
      $("result").innerHTML = `<div class="card" style="--c:${w === null ? "#f0c75e" : COLORS[w]}">
        <p class="kicker">${w === null ? "Draw" : "Match winner"} · Bo${match.bestOf}</p>
        ${p?.photo ? `<img src="${p.photo}" alt="">` : ""}
        <h2>${p ? p.name : "All square"}</h2>
        <p class="final"><span style="color:${COLORS[0]}">${s.a}</span> – <span style="color:${COLORS[1]}">${s.b}</span></p>
        <table><tbody>${match.games.map((x, g) => `<tr><td>Game ${g + 1}</td><td>${match.arenas[g].name}</td><td style="color:${COLORS[SIDE[x]]}">${name(SIDE[x])}</td></tr>`).join("")}</tbody></table>
        <p class="kicker" style="margin-top:12px;color:var(--muted)">In the app this goes back to the match as games [${match.games.map((x) => `"${x}"`).join(", ")}]; nothing else is kept.</p>
        <div class="actions"><button class="primary" id="again">New match</button><button id="close">Close</button></div>
      </div>`;
      $("result").hidden = false;
      $("again").onclick = () => { $("result").hidden = true; onAgain(); };
      $("close").onclick = () => { $("result").hidden = true; };
    },
  };
}
