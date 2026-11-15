// The words of one Season Story item: kicker, colour and headline per kind. Shared by the Season Story cards and the
// Simulation Timeline. Copy (user via router, 2026-11-15): news stays Indonesian, lively sports-media headlines, semi-formal.
import type { AnyStory as Story } from "@sabung/engine";

type Name = (id: string) => string;

export const KICKER: Record<Story["kind"], string> = { "points-record": "Rekor pecah", "late-promotion": "Promosi dramatis", upset: "Kejutan", "reverse-sweep": "Comeback", streak: "Tren positif", "first-title": "Juara baru", "idol-of-month": "Bintang bulan ini", rivalry: "Rivalitas", "multi-title": "Borong gelar", "title-milestone": "Tonggak sejarah", slump: "Krisis", unbeaten: "Tak terkalahkan", "big-match": "Laga akbar", "shock-exit": "Tersingkir", clinched: "Juara lebih awal", champion: "Juara", "rivalry-renewed": "Rivalitas lama", farewell: "Perpisahan" };
export const TONE: Record<Story["kind"], string> = { "points-record": "brand-gold", "first-title": "brand-gold", upset: "accent-bright", "reverse-sweep": "brand-violet", streak: "brand-teal", "late-promotion": "brand-lime", "idol-of-month": "brand-rose", rivalry: "brand-orchid", "multi-title": "brand-gold", "title-milestone": "brand-amber", slump: "brand-sky", unbeaten: "brand-gold", "big-match": "brand-indigo", "shock-exit": "accent-bright", clinched: "brand-gold", champion: "brand-gold", "rivalry-renewed": "brand-orchid", farewell: "muted" };

// The idol whose photo leads the item.
export const starOf = (s: Story) => ("winner" in s ? s.winner : "idol" in s ? s.idol : s.a);

export function headline(s: Story, name: Name, label: Name): string {
  switch (s.kind) {
    case "upset": return `Kejutan Besar! ${name(s.winner)} Tumbangkan ${name(s.loser)} Meski Kalah Rating ${s.gap} Poin`;
    case "reverse-sweep": return `Bangkit dari Jurang, ${name(s.winner)} Balikkan Keadaan atas ${name(s.loser)}`;
    case "streak": return `${name(s.idol)} Tak Terbendung, Sapu ${s.wins} Kemenangan Beruntun`;
    case "first-title": return `Penantian Berakhir! ${name(s.idol)} Rebut Gelar ${label(s.title)} Perdananya`;
    case "points-record": return `Sejarah Tercipta: ${name(s.idol)} Kumpulkan ${s.points} Poin di ${label(s.league)}, Rekor ${s.previous} Tumbang`;
    case "late-promotion": return `Comeback Dramatis! ${name(s.idol)} Melesat dari Peringkat ${s.from} ke ${s.to} dan Promosi dari ${label(s.league)}`;
    case "rivalry": return `${name(s.a)} vs ${name(s.b)}: ${s.meetings} Duel Panas Musim Ini, Skor Sementara ${s.winsA}–${s.winsB}`;
    case "multi-title": return `${name(s.idol)} Berpesta Gelar! Borong ${s.titles.length} Trofi: ${s.titles.map(label).join(", ")}`;
    case "title-milestone": return `${name(s.idol)} Cetak Sejarah, Kini Koleksi ${s.total} Gelar Sepanjang Karier`;
    case "slump": return `Alarm Bahaya! ${name(s.idol)} (Rating ${s.rating}) Telan ${s.losses} Kekalahan Beruntun`;
    case "unbeaten": return `Tanpa Cela! ${name(s.idol)} Tak Tersentuh Kekalahan di ${label(s.league)}: ${s.wins} Menang, ${s.draws} Seri`;
    case "idol-of-month": return `${name(s.idol)} Bersinar Paling Terang di Matchday ${s.from}–${s.to} dengan ${s.wins} Kemenangan`;
    case "big-match": return s.draw ? `Duel Raksasa ${name(s.winner)} vs ${name(s.loser)} Berakhir Imbang` : `Duel Raksasa! ${name(s.winner)} (${s.ratingWinner}) Taklukkan ${name(s.loser)} (${s.ratingLoser})`;
    case "shock-exit": return `Mengejutkan! ${name(s.loser)} Angkat Koper dari ${label(s.comp)} di Tangan ${name(s.winner)}`;
    case "clinched": return `${name(s.idol)} Pastikan Gelar ${label(s.league)} di Matchday ${s.matchday}, ${s.left} Laga Lebih Cepat`;
    case "rivalry-renewed": return `Rivalitas Lama Bersemi Lagi: ${name(s.a)} vs ${name(s.b)}, ${s.meetings} Duel Musim Ini setelah ${s.earlier} Pertemuan Sebelumnya`;
    case "farewell": return s.titles ? `Selamat Tinggal, ${name(s.idol)}! Sang Pemilik ${s.titles} Gelar Tak Lagi Berlaga` : `${name(s.idol)} Absen Musim Ini, Tak Lagi Berlaga di Arena`;
    case "champion": return `${name(s.idol)} Juara ${label(s.title)}! ${name(s.runnerUp)} Harus Puas di Posisi Kedua`;
  }
}
