// The words of the Simulation Timeline: a label per point ("Matchday 7", "Swiss R3", "QF") and the kicker, colour and
// headline of its timeline-only stories; every Season Story kind keeps its own words (storyText). Headlines stay
// Indonesian like the news; labels are English like the rest of the UI.
import type { TimelinePoint, TimelineStory, TrackStory } from "@sabung/engine";
import { KICKER, TONE, headline as newsHeadline, starOf as newsStar } from "../story/storyText";

type Name = (id: string) => string;

const TRACK_KICKER: Record<TrackStory["kind"], string> = { "rivalry-result": "Rivalitas panas", "new-leader": "Pemimpin baru", "leader-run": "Raja klasemen", zone: "Zona panas", "top-miss": "Tercecer", failed: "Bintang tumbang", escape: "Lolos tipis", qualified: "Lolos", "giant-killer": "Pembunuh raksasa", final: "Final" };
const TRACK_TONE: Record<TrackStory["kind"], string> = { "rivalry-result": "brand-orchid", "new-leader": "brand-gold", "leader-run": "brand-gold", zone: "brand-sky", "top-miss": "brand-sky", failed: "accent-bright", escape: "brand-lime", qualified: "brand-teal", "giant-killer": "brand-violet", final: "brand-gold" };
export const isTrack = (s: TimelineStory): s is TrackStory => s.kind in TRACK_KICKER;

export const kickerOf = (s: TimelineStory) => (isTrack(s) ? TRACK_KICKER[s.kind] : KICKER[s.kind]);
export const toneOf = (s: TimelineStory) => `var(--color-${isTrack(s) ? TRACK_TONE[s.kind] : TONE[s.kind]})`;
export const starOf = (s: TimelineStory) => (!isTrack(s) ? newsStar(s) : s.kind === "qualified" ? s.idols[0]! : "winner" in s ? s.winner : s.idol);

const ZONE = { relegation: ["Terperosok ke Zona Degradasi", "Keluar dari Zona Degradasi"], promotion: ["Masuk Zona Promosi", "Terlempar dari Zona Promosi"], bottom: ["Kini Jadi Juru Kunci", "Lepas dari Dasar Klasemen"] } as const;
const FAILED = { swiss: "Tersingkir di Swiss", lcq: "Gagal di LCQ", groups: "Angkat Koper di Fase Grup", unzure: "Gagal Menembus Unzure Cup" } as const;
const ESCAPE = { decider: "Lolos dari Lubang Jarum di Laga Penentuan", "last-matchday": "Lolos di Matchday Terakhir", tiebreak: "Lolos Berkat Tiebreak" } as const;

export function headlineOf(s: TimelineStory, name: Name, label: Name): string {
  if (!isTrack(s)) return newsHeadline(s, name, label);
  switch (s.kind) {
    case "rivalry-result": return s.draw ? `Rivalitas Panas: ${name(s.winner)} dan ${name(s.loser)} Berbagi Angka` : `Rivalitas Panas: ${name(s.winner)} Menang atas ${name(s.loser)}`;
    case "new-leader": return `${name(s.idol)} Rebut Puncak ${label(s.league)} dari ${name(s.previous)}`;
    case "leader-run": return `${name(s.idol)} Kokoh di Puncak Sejak Matchday ${s.since}, ${s.matchdays} Matchday Beruntun`;
    case "zone": return `${name(s.idol)} ${ZONE[s.zone][s.entered ? 0 : 1]}`;
    case "top-miss": return `${name(s.idol)} (Rating ${s.rating}) Tercecer di Peringkat ${s.rank}`;
    case "failed": return `${name(s.idol)} (${s.rating}) ${FAILED[s.stage]}`;
    case "escape": return `${name(s.idol)} ${ESCAPE[s.how]}`;
    case "qualified": return `${s.idols.length} Idol Lolos: ${s.idols.slice(0, 3).map(name).join(", ")}${s.idols.length > 3 ? ` +${s.idols.length - 3}` : ""}`;
    case "giant-killer": return `Pembunuh Raksasa! ${name(s.idol)} Tumbangkan ${s.wins} Unggulan di ${label(s.comp)}`;
    case "final": return `Final ${label(s.comp)}: ${name(s.winner)} Kalahkan ${name(s.loser)} ${s.score}`;
  }
}

const KO: Record<string, string> = { QF: "QF", SF: "SF", F: "Final", GF: "Grand final", "3RD": "Third place" };
// "Matchday 7", "Swiss R3", "LCQ MD2", "Groups MD1", "Round 2", "QF"…; in the whole-season view the competition first.
export function pointLabel(p: TimelinePoint, label: Name, withComp: boolean): string {
  const tail = p.round.split("-").at(-1)!;
  const own = p.stage === "LG" ? `Matchday ${Number(p.round.slice(2))}`
    : p.stage === "SW" ? `Swiss ${tail}`
    : p.stage === "LQ" ? `LCQ ${tail}`
    : p.stage === "GS" ? (p.round === "DRAW" ? "Group draw" : `Groups ${tail}`)
    : `${p.stage === "UB" ? "Upper " : p.stage === "LB" ? "Lower " : ""}${KO[p.round] ?? `Round ${p.round.replace(/\D/g, "")}`}`;
  return withComp ? `${label(p.comp)} · ${own}` : own;
}
