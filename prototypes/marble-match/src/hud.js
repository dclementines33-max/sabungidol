// The broadcast overlay. Top: the scoreboard (duel: both faces, names and games won around the series line; Grand Prix:
// race number and the top three on points). Right: the live standing (gaps, or sumo in/out). Bottom: one chip per game
// (its arena, the winner's colour). Plus the intro card, start lights, banners and the match result.
import { POINTS, games, seriesTarget, standing } from "./match.js";

const $ = (id) => document.getElementById(id);
export const COLORS = ["#ff4d63", "#9fd8ff", "#f0c75e", "#7ee787", "#c084fc", "#fb923c", "#22d3ee", "#f472b6", "#a3e635", "#fde047",
  "#60a5fa", "#f87171", "#34d399", "#e879f9", "#fca5a5", "#93c5fd", "#fdba74", "#5eead4", "#d9f99d", "#e5e7eb"];
const face = (p, c) => (p.photo ? `<img src="${p.photo}" alt="" style="--c:${c}">` : `<span class="noface" style="--c:${c}">${p.name[0]}</span>`);

export function createHud(players) {
  let bannerTimer = 0;
  const name = (k) => players[k].name;
  return {
    arena(match, g) {
      const a = match.arenas[g];
      $("arena-name").textContent = a.name;
      $("arena-tag").textContent = `${match.gp ? "Race" : "Game"} ${g + 1} · ${a.tagline}`;
    },
    scoreboard(match, g) {
      const s = standing(match), a = match.arenas[g];
      if (!match.gp) {
        $("scoreboard").innerHTML = `<div class="side red">${face(players[0], COLORS[0])}<span class="who">${name(0)}</span><b class="pts">${s.a}</b></div>
          <div class="mid"><span>Best of ${match.bestOf} · first to ${seriesTarget(match.bestOf)}</span><strong>Game ${g + 1}</strong><small>${a.name}</small></div>
          <div class="side blue"><b class="pts">${s.b}</b><span class="who">${name(1)}</span>${face(players[1], COLORS[1])}</div>`;
      } else {
        $("scoreboard").innerHTML = `<div class="mid"><span>Grand Prix · ${match.ratings.length} marbles</span><strong>Race ${g + 1} / ${match.bestOf}</strong><small>${a.name}</small></div>`
          + s.table.slice(0, 3).map((k, i) => `<div class="gp" style="--c:${COLORS[k]}"><b>${i + 1}</b>${face(players[k], COLORS[k])}<span class="who">${name(k)}</span><b class="pts">${s.points[k]}</b></div>`).join("");
      }
    },
    update(game) {
      $("clock").textContent = game.state.t.toFixed(2);
      const all = game.order(), many = all.length > 8;
      $("tower").classList.toggle("many", many);
      $("tower").innerHTML = all.map((m, i) => {
        const note = game.sumo ? (m.out !== null ? "Out" : "In") : i === 0 ? (m.finished !== null ? "Winner" : "Leader") : m.finished !== null ? `+${(m.finished - all[0].finished).toFixed(2)}s` : `+${Math.max(0, all[0].prog - m.prog).toFixed(1)}m`;
        return `<li style="--c:${COLORS[m.k]}" class="${m.boosting ? "boost" : ""}"><span class="pos">${i + 1}</span><span class="dot"></span><span class="name">${name(m.k)}</span><span class="gap">${note}</span></li>`;
      }).join("");
    },
    series(match, current = -1) {
      const s = standing(match), g = games(match);
      const shown = match.gp ? match.bestOf : Math.min(match.bestOf, Math.max(g.length + (s.result ? 0 : 1), seriesTarget(match.bestOf)));
      $("series").innerHTML = Array.from({ length: shown }, (_, i) => {
        const w = match.results[i]?.[0];
        return `<span class="chip ${i === current ? "now" : ""}" style="--c:${w === undefined ? "#333" : COLORS[w]}" title="${match.arenas[i].name}">${match.gp ? "R" : "G"}${i + 1}<small>${match.arenas[i].name.split(" ")[0]}</small></span>`;
      }).join("");
    },
    intro(match, g, show) {
      const a = match.arenas[g];
      $("intro").hidden = !show;
      if (show) $("intro").innerHTML = `<p class="kicker">${match.gp ? `Race ${g + 1} of ${match.bestOf}` : `Game ${g + 1} of Bo${match.bestOf}`}</p><h2>${a.name}</h2><p>${a.tagline}</p>`;
    },
    lights(n) { $("lights").hidden = n < 0; [...$("lights").children].forEach((s, i) => s.classList.toggle("on", i < n)); },
    banner(text, ms = 1600) {
      clearTimeout(bannerTimer);
      $("banner").textContent = text; $("banner").hidden = false;
      bannerTimer = setTimeout(() => { $("banner").hidden = true; }, ms);
    },
    result(match, onAgain) {
      const s = standing(match);
      let body;
      if (!match.gp) {
        const w = s.result === "D" ? null : s.result === "A" ? 0 : 1, p = w === null ? null : players[w];
        body = `<div class="card" style="--c:${w === null ? "#f0c75e" : COLORS[w]}"><p class="kicker">${w === null ? "Draw" : "Match winner"} · Bo${match.bestOf}</p>
          ${p?.photo ? `<img src="${p.photo}" alt="">` : ""}<h2>${p ? p.name : "All square"}</h2>
          <p class="final"><span style="color:${COLORS[0]}">${s.a}</span> – <span style="color:${COLORS[1]}">${s.b}</span></p>
          <table><tbody>${match.results.map((r, g) => `<tr><td>Game ${g + 1}</td><td>${match.arenas[g].name}</td><td style="color:${COLORS[r[0]]}">${name(r[0])}</td></tr>`).join("")}</tbody></table>
          <p class="kicker" style="margin-top:12px;color:var(--muted)">In the app this goes back to the match as games [${games(match).map((x) => `"${x}"`).join(", ")}]; nothing else is kept.</p>`;
      } else {
        const top = s.table.slice(0, 3);
        body = `<div class="card wide" style="--c:${COLORS[top[0]]}"><p class="kicker">Grand Prix champion · ${match.bestOf} races · ${match.ratings.length} marbles</p>
          <div class="podium">${[1, 0, 2].filter((i) => top[i] !== undefined).map((i) => `<div class="step p${i + 1}" style="--c:${COLORS[top[i]]}">${face(players[top[i]], COLORS[top[i]])}<b>${name(top[i])}</b><span>${s.points[top[i]]} pts</span><i>${i + 1}</i></div>`).join("")}</div>
          <table class="gpt"><thead><tr><th>#</th><th>Marble</th><th>Wins</th><th>Pts</th></tr></thead><tbody>${s.table.map((k, i) => `<tr><td>${i + 1}</td><td style="color:${COLORS[k]}">${name(k)}</td><td>${s.wins[k]}</td><td>${s.points[k]}</td></tr>`).join("")}</tbody></table>
          <p class="kicker" style="margin-top:10px;color:var(--muted)">Points per race: ${POINTS.join("-")}.</p>`;
      }
      $("result").innerHTML = `${body}<div class="actions"><button class="primary" id="again">New match</button><button id="close">Close</button></div></div>`;
      $("result").hidden = false;
      $("again").onclick = () => { $("result").hidden = true; onAgain(); };
      $("close").onclick = () => { $("result").hidden = true; };
    },
  };
}
