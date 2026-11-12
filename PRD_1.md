# PRD — Idol Tournament Simulator ("Sabung Idol")

Nov 12, 2026 · @Carmen · Status: Draft v1.0

## 1. Ringkasan Produk

Sabung Idol adalah simulator turnamen idol untuk satu pengguna: setiap season menjalankan 9 kompetisi (13 liga dan 6 cup) dengan engine berbasis rating, lalu menyimpan setiap match ke database lokal yang menjadi sumber tunggal untuk statistik, rekor, dan arsip ala wiki. Referensi rasa: mode karier FIFA (siklus season, progresi), UEFA Champions League (Unzure Cup), dan Wikipedia/Transfermarkt (kedalaman data).

**Visi.** Terasa seperti game premium sekaligus ensiklopedia: foto idol jadi pusat setiap layar, setiap angka bisa diklik sampai ke match asalnya.

**Tujuan v1**

1. Satu season penuh (± 5.600 match) bisa disimulasikan dengan satu tombol dalam < 10 detik di laptop menengah, tanpa UI membeku.
2. Setiap statistik dihitung ulang dari tabel match, tidak pernah dari counter yang bisa melenceng.
3. Data match 20 season < 25 MB di browser; foto 240 idol ± 35 MB disimpan sekali, terpisah dari record.
4. User bisa memasukkan 240 idol (12 liga × 20) lewat paste batch dalam < 5 menit.
5. Backup dan restore penuh antar device/browser lewat satu file.

**Non-goals v1**

- Multiplayer, akun publik, atau leaderboard online.
- Sinkronisasi real-time antar device (diganti backup/restore; sync cloud opsional di fase akhir).
- Data idol bawaan atau scraping foto dari internet: semua data dimasukkan user.
- Taruhan, monetisasi, iklan.

## 2. Pengguna, Prinsip, dan Alur Utama

Pengguna tunggal adalah "Commissioner": penggemar K-pop yang ingin membangun semesta kompetisi idolnya sendiri dan menikmati sejarah yang terbentuk season demi season.

**Prinsip produk**

- **Foto adalah pusat.** Di mana ada nama idol, ada fotonya (thumbnail 64 px di list, 256 px di kartu, ukuran penuh di profil dan popup match).
- **Satu sumber kebenaran.** Satu tabel match, append-only; semua statistik, rekor, dan arsip adalah turunan.
- **Tidak ada yang tertulis tanpa izin.** Aksi massal selalu preview dulu; aksi berbahaya butuh konfirmasi ketik.
- **Notifikasi sebelum masalah.** Setiap kondisi aneh (duplikat, roster kurang, kompetisi belum selesai) diberi tahu sebelum user melangkah.
- **Ringan dulu, indah kemudian.** Animasi tidak boleh menahan simulasi; semua kerja berat di Web Worker.

**Alur utama**

1. **Onboarding:** pilih "Season baru dari nol" atau "Restore dari backup". Wizard: paste daftar idol → preview → bagi otomatis ke 12 liga (berdasar rating/seed) → upload foto massal (cocokkan nama file dengan nama idol).
2. **Menjalankan season:** buka Sabung Idol → "Simulate Whole Season" atau masuk ke panel kompetisi dan jalankan per match / per matchday / semua.
3. **Menikmati hasil:** Dashboard, Season Story, Hall of Champions, profil idol, head-to-head.
4. **Menutup season:** archive guard memeriksa semua kompetisi selesai → Rating Progression (preview → Save) → promosi/degradasi otomatis → "Start New Season".
5. **Pindah device:** Settings → Backup penuh (.sabung) → di device baru Restore → preview isi → Confirm & Apply.

## 3. Glosarium dan Model Data

Semua entitas memakai id stabil (ULID untuk idol/group, id deterministik untuk match); nama hanya label tampilan.

| Istilah | Field / definisi | Aturan |
| --- | --- | --- |
| Idol | id, name, groupId (null = Soloist), seed 1–4, nationality (ISO-3166), birthday, photoId, rating 0–100 (bulat), status active/inactive | Nama + group unik; nama sama beda group = idol berbeda (warning) |
| Girl Group | id, name, logoId, daftar member (turunan dari idol.groupId) | Tanpa group tampil "Soloist" |
| Photo | id, blob asli, thumb 64 px, card 256 px (WebP) | Disimpan sekali, direferensikan oleh idolId; tidak pernah disalin ke record |
| Rating | Kekuatan dasar untuk simulator | Diubah oleh Rating Manager atau Progression Engine; setiap perubahan masuk rating\_history |
| Form | On Fire, Hot Streak, Confident, Steady, Cold Slump | Dihitung dari 5 match terakhir lintas kompetisi; memberi modifier kecil (§5) |
| Tier | S ≥ 90, A 80–89, B 70–79, C 60–69, D < 60 | Warna chip RatingBadge |
| Season | id, nomor, nama, seed RNG, status (draft/live/completed/archived), kompetisi aktif | Satu siklus semua kompetisi; seluruh data per season disimpan |
| Competition | code, nama tampilan, logo, branding warna, tipe (league/cup/swiss/super) | Nama dan logo dapat diubah di Settings, code tidak |
| Stage | league, swiss, lcq, group, knockout, playoff-ub, playoff-lb, final | Menentukan format BoN default |
| Match | id deterministik, seasonId, competition, stage, round, idolA, idolB, games\[\], scoreA, scoreB, result, method (sim/manual/wheel), ratingA/B saat main, formA/B saat main, playedAt | Append-only; unik per id |
| Best of N | Bo3, Bo4, Bo5, Bo7 | Hanya Bo4 yang bisa seri 2–2 |

**Format id match (satu classifier, berdasar prefix):** `S{season}-{COMP}-{STAGE}-{ROUND}-{SLOT}`, contoh `S03-D1B-LG-MD17-M04`, `S03-UZC-GS-C-MD2-M1`, `S03-NUG-KO-R3-M41`. Kode kompetisi: D1A–D1F, D2A–D2F, IDL, SWS, LCQ, UZC, INK, NUG, BSA–BSF (B-Side per liga), DSG, MBK. Semua penghitungan "apakah ini match liga" membaca prefix, tidak pernah `stage.includes(...)`.

## 4. Siklus Season dan Format Kompetisi

Satu season = 9 kompetisi, ± 5.600 match, berjalan dalam 4 fase; setiap kompetisi bisa dinonaktifkan di Settings dan kompetisi yang bergantung padanya ikut diberi peringatan.

&#91;embedded content: jalur kualifikasi Unzure Cup · 36 + 20 + 8\]

Tiga jalur menuju Unzure Cup: 36 idol langsung dari liga, 20 dari Swiss, dan 8 dari LCQ; 36 idol lain gugur di play-in.

| Kompetisi | Peserta | Format | BoN | Match/season |
| --- | --- | --- | --- | --- |
| Liga Divisi 1 (×6) | 20 per liga | Double round robin, 38 matchday × 10 match | Bo4 (bisa seri) | 6 × 380 = 2.280 |
| Liga Divisi 2 / Trainee (×6) | 20 per liga | Double round robin, 38 matchday | Bo4 | 2.280 |
| The Idols | 20 rating tertinggi | Liga 38 matchday + playoff double elimination top 10 | Bo4, playoff Bo5, GF Bo7 | 380 + 18 |
| Swiss Play-in | 64 (4 grup × 16) | Swiss sampai 3 menang / 3 kalah | Bo3 | ± 132 |
| Last Chance Qualifier | 12 (2 grup × 6) | Single round robin | Bo3 | 30 |
| Unzure Cup | 64 | 16 grup × 4, lalu knockout 32 | Grup Bo4, KO Bo5, 3rd & Final Bo7 | 96 + 32 |
| Inkigayo Cup | 6 juara liga D1 | Double elimination, seed 1–2 bye | Bo5, GF Bo7 | 9 |
| Nugu Cup | 240 (D1 + D2) | Single elimination, 9 ronde | Bo3, SF Bo5, Final Bo7 | 239 |
| B-Side Cup (×6) | Top 16 tiap liga D1 | Single elimination 16, 1 v 16 dst. | Bo3, Final Bo5 | 6 × 15 = 90 |
| Daesang Cup | Juara The Idols vs juara Unzure Cup | Satu match | Bo7 | 1 |
| Music Bank Cup (×6) | Juara liga D1 vs juara B-Side liga itu | Satu match per liga | Bo5 | 6 |

BoN yang tidak disebut di brief (Swiss/LCQ sudah, sisanya usulan) dapat diubah per stage di Settings.

**Fase season**

1. **Fase Liga:** 12 liga + The Idols berjalan paralel per matchday (matchday 1 semua liga, lalu matchday 2, dst.).
2. **Fase Cup:** Swiss → LCQ → Unzure group → Unzure KO; paralel dengan B-Side, Nugu, Inkigayo, dan playoff The Idols.
3. **Gala Night:** Daesang Cup dan Music Bank Cup sebagai penutup.
4. **Penutupan:** promosi/degradasi, rating progression, achievements, arsip.

**Kualifikasi Unzure Cup (total tepat 64)**

- Langsung: peringkat 1–6 tiap liga D1 = 36.
- Swiss: peringkat 7–16 tiap liga (60) + 4 peringkat 17 terbaik (urut poin, lalu tie-break) = 64. Tidak pernah mengisi dengan peringkat 1–6; jika liga kurang dari 17 idol berperingkat, sisa slot diisi peringkat 17/18 terbaik liga lain dan user diberi notifikasi.
- Swiss per grup 16: 3–0 (2 idol) dan 3–1 (3 idol) lolos langsung = 20; 3–2 (3 idol) ke LCQ = 12.
- LCQ: 2 grup × 6, 4 teratas tiap grup lolos = 8. Catatan: brief menulis "4 teratas"; agar total 64 (36 + 20 + 8), angka ini dibaca per grup.

**Pot draw Unzure Cup (4 pot × 16)**

| Pot | Isi |
| --- | --- |
| 1 | Juara + runner-up 6 liga (12) + 4 peringkat 3 terbaik |
| 2 | 2 peringkat 3 sisa + peringkat 4 (6) + peringkat 5 (6) + 2 peringkat 6 terbaik |
| 3 | 4 peringkat 6 sisa + Swiss 3–0 (8) + 4 Swiss 3–1 terbaik |
| 4 | 8 Swiss 3–1 sisa + 8 lulusan LCQ |

"Terbaik" antar liga = poin liga, lalu selisih game, lalu game menang, lalu rating.

**Promosi / degradasi:** peringkat 18–20 D1 turun ke D2 pasangannya; peringkat 1–3 D2 naik. Diterapkan saat Start New Season, dengan preview roster baru.

**The Idols:** 20 idol rating tertinggi (status active) saat season dibuat; mereka tetap bermain di liga asalnya (asumsi, lihat Open Questions). Juara liga = "Superleague"; juara playoff = "The Idols Champion". Template playoff 10 idol:

- Upper: R1 5v8, 6v7 → QF 4 v W(5/8), 3 v W(6/7) → SF 1 v W(QF1), 2 v W(QF2) → UB Final.
- Lower: LB1 9v10, L(R1a) v L(R1b) → LB2 silang dengan kalah QF → LB3 dengan kalah SF → LB4 → LB Final vs kalah UB Final → Grand Final (Bo7, tanpa bracket reset).

**Inkigayo Cup:** seed dari poin liga. UB R1: 3v6, 4v5 (kalah = pulang). UB SF: 1 v W(4/5), 2 v W(3/6). Kalah UB SF → LB SF; pemenang vs kalah UB Final → LB Final → Grand Final.

**Nugu Cup, entry plan yang terpecahkan.** Dengan 120 idol D2 di ronde 1, bye D1 sebanyak 3–4 ronde tidak mungkin menghasilkan 9 ronde berjumlah genap (setelah 3 ronde hanya tersisa 15 idol D2, sehingga butuh 191 idol D1 masuk di ronde 4). Rencana yang tepat dengan bye 1–2 ronde:

| Ronde | Masuk baru | Peserta | Match |
| --- | --- | --- | --- |
| R1 | 120 idol D2 | 120 | 60 |
| R2 | 44 idol D1 (peringkat 14–20 + 2 peringkat 13 terlemah) | 104 | 52 |
| R3 | 76 idol D1 (peringkat 1–12 + 4 peringkat 13 terbaik) | 128 | 64 |
| R4–R9 | – | 64 → 32 → 16 → 8 → 4 → 2 | 63 |

Total 239 match. Solver generik (§5) menghitung ulang rencana bila roster berubah dan menolak rencana yang menghasilkan ronde ganjil.

**Daesang & Music Bank, aturan bentrok:** jika idol yang sama juara di kedua sisi, lawannya adalah runner-up kompetisi kedua (Unzure Cup / B-Side). User diberi notifikasi.

## 5. Simulation Engine (dibangun dan dites pertama)

Engine adalah paket TypeScript murni (`@sabung/engine`) tanpa UI dan tanpa I/O: masuk roster + seed, keluar match. Ia berjalan di Web Worker dan dites dengan Vitest sebelum satu layar pun dibuat.

**5.1 Peluang per game.** Model logistik ala Elo pada skala 0–100:

```latex
P(A) = \frac{1}{1 + 10^{-(E_A - E_B)/40}}
```

Effective rating E = rating + modifier form + variance per match (normal, σ = 4, diambil sekali per idol per match). Variance per match membuat ada "hari buruk" yang konsisten sepanjang satu seri, sehingga upset terasa nyata, bukan acak per game.

| Selisih rating | Per game | Bo3 | Bo5 | Bo7 | Bo4 M/S/K |
| --- | --- | --- | --- | --- | --- |
| 0 | 50% | 50% | 50% | 50% | 31/38/31 |
| 5 | 57% | 61% | 63% | 65% | 43/36/21 |
| 10 | 64% | 70% | 75% | 78% | 55/32/14 |
| 20 | 76% | 85% | 91% | 94% | 75/20/5 |
| 30 | 85% | 94% | 97% | 99% | 89/10/1 |

Angka di atas sebelum variance dan form; variance menurunkan peluang favorit beberapa poin. Konstanta 40 dan σ dapat diatur di Rating Manager ("Engine Tuning") dengan preset Realistic / Chaotic / Dominant.

**5.2 Form.** Dihitung dari 5 match terakhir lintas kompetisi (menang 1, seri 0,5):

| Form | Syarat | Modifier |
| --- | --- | --- |
| On Fire | 5 menang beruntun | +3 |
| Hot Streak | skor ≥ 4 | +2 |
| Confident | skor 3–3,5 | +1 |
| Steady | skor 2–2,5 | 0 |
| Cold Slump | skor ≤ 1,5 | −2 |

**5.3 Jalannya seri.** Game dimainkan satu per satu sampai format selesai (Bo3/5/7: first to 2/3/4; Bo4: first to 3 atau 2–2 = seri). Setiap game disimpan (urutan pemenang) untuk replay, rekor comeback, dan reverse sweep. Usulan tambahan: momentum kecil +1 untuk pemenang game sebelumnya, default off.

**5.4 Determinisme.** RNG terseed (mulberry32 / xoshiro128\*\*) dengan seed = hash(season.seed, matchId). Simulasi ulang match yang sama dengan rating sama memberi hasil sama; tombol "Re-roll" memakai salt baru dan dicatat.

**5.5 Klasemen.** Poin 3/1/0. Urutan tie-break (usulan, karena brief merujuk "as above" tanpa daftar): poin → selisih game → game menang → poin head-to-head → selisih game head-to-head → jumlah menang → rating saat musim dimulai → id idol. Klasemen selalu disusun ulang dengan satu comparator resmi; urutan array tersimpan tidak pernah dipercaya.

**5.6 Swiss pairing.** Ronde 1: pot order (seed 1 v seed 16 dalam grup). Ronde berikutnya: idol dengan rekor sama dipasangkan acak tanpa pernah mengulang lawan; solver backtracking mencari semua kombinasi dan baru jatuh ke "lawan terdekat beda rekor" bila mustahil, dengan notifikasi.

**5.7 Group draw Unzure Cup.** 16 grup, satu idol per pot per grup. Constraint: keras = tepat 4 idol per grup, beda girl group; lunak = beda liga bila memungkinkan. Solver backtracking terseed; animasi draw ala UCL (bola per pot) bisa dilewati.

**5.8 Knockout seeding.** 16 juara grup ditempatkan merata (8 di tiap paruh bracket); juara tidak bertemu runner-up grupnya sendiri di R32; usulan tambahan: hindari rekan liga di R32 bila memungkinkan.

**5.9 Entry solver Nugu Cup.** Diberi jumlah peserta D2 dan D1 serta jumlah ronde, solver mencari distribusi masuk per ronde sehingga setiap ronde genap dan final berisi 2 idol, mengutamakan bye lebih panjang untuk peringkat lebih tinggi. Hasil default ada di §4.

**5.10 Acceptance test engine**

- [ ] 100.000 game dengan selisih 10 memberi 64% ± 0,5% (tanpa variance).
- [ ] Liga 20 idol menghasilkan 380 match, setiap pasangan tepat 2 kali, kandang/tandang seimbang.
- [ ] Swiss tidak pernah mengulang lawan pada 10.000 simulasi acak.
- [ ] Group draw selalu valid pada 10.000 seed; gagal = error eksplisit, bukan grup 3 idol.
- [ ] Satu season penuh selesai < 10 detik di Worker, tanpa frame UI > 50 ms.

## 6. Rating Progression

Rating berubah hanya lewat tiga jalur yang semuanya preview dulu: edit manual, Season Progression (otomatis di akhir season), dan Sync from Career Stats. Semua perubahan tercatat di `rating_history` (idolId, seasonId, old, new, source, alasan).

**6.1 Bobot prestige.** Nama turnamen di brief (Supreme, Crown, Champion Shield, Open Arena, Spotlight) dipetakan ke nama baru sebagai asumsi:

| # | Kompetisi | Nama lama di brief | Bobot |
| --- | --- | --- | --- |
| 1 | Unzure Cup | – | 1,00 |
| 2 | The Idols (playoff + Superleague) | – | 0,90 |
| 3 | Inkigayo Cup | Supreme Cup | 0,75 |
| 4 | Liga Divisi 1 | – | 0,70 |
| 5 | Daesang Cup | Crown Cup | 0,55 |
| 6 | Music Bank Cup | Champion Shield Cup | 0,45 |
| 7 | Nugu Cup | Open Arena Cup | 0,40 |
| 8 | B-Side Cup | Spotlight Cup | 0,35 |
| 9 | Liga Divisi 2 | – | 0,25 |

**6.2 Poin pencapaian.** Juara 100, runner-up 70, peringkat 3 55, peringkat 4 45, perempat final 30, babak 16 20, lolos grup 12, gugur grup 5. Liga: 100 × (21 − peringkat) / 20. Skor season = Σ (poin × bobot) + 10 × (win rate season − 0,5).

**6.3 Season Progression (default di akhir season).**

1. Hitung skor ekspektasi dari rating awal season (regresi skor vs rating seluruh idol aktif).
2. Delta = k × (skor aktual − skor ekspektasi), k = 0,08, dibatasi ±6 per season.
3. Bonus juara: +2 untuk juara kompetisi berbobot ≥ 0,70, +1 untuk lainnya (maks +3).
4. Regresi ke rata-rata 3% untuk rating > 92 agar puncak tidak membeku di 100.
5. Penalti degradasi −2, bonus promosi +2.

**6.4 Update Rating (Last Season).** Sama seperti 6.3 tetapi hanya memakai season terakhir yang diarsip dan bisa dijalankan ulang (idempoten: menghitung dari rating sebelum progression season itu).

**6.5 Sync from Career Stats.** Rating target = pemetaan persentil skor all-time tertimbang (season terbaru bobot 1,0, menurun 15% per season ke belakang) ke rentang 45–98. Mode: "Replace" atau "Blend 50/50" dengan rating sekarang.

**6.6 Preset di Rating Manager**

- **Apply Seed Presets:** seed 1 = 88, 2 = 80, 3 = 72, 4 = 64 (± acak 3 bila dipilih).
- **Realistic Variety:** distribusi normal (μ 72, σ 9) dengan urutan rating sekarang dipertahankan.
- **Reset All to 75.**
- **Apply Season Progression:** menjalankan 6.3 untuk season aktif bila sudah selesai.

Usulan tambahan: **Breakout & Decline Events.** Peluang 3% per season seorang idol mendapat "Breakout" (+4) atau "Slump Season" (−4), ditampilkan sebagai berita di Season Story.

## 7. Career Stats, Records, dan Achievements

Semua angka di bagian ini adalah query atas tabel match dan placement; cache boleh ada, tetapi selalu bisa dibangun ulang dari nol dengan tombol "Rebuild Stats" dan hasilnya harus identik.

**7.1 Career stats per idol** (per kompetisi dan Combined): titles, runner-up, third, fourth, group exit, group advance, matches, W-D-L, win rate, games for/against, game difference, rata-rata game per match, longest win / losing / unbeaten streak, average / best / worst placement, poin liga total, rating tertinggi, season aktif.

**7.2 Tabel placement.** Setiap kompetisi selesai menulis satu baris per peserta ke `placements` (seasonId, comp, idolId, finalRank, stageReached). Rekor gelar dan podium membaca tabel ini, bukan menghitung ulang bracket.

**7.3 Records engine**

- Competition ranking dengan seri: 1, 2, T3, T3, 5.
- Peringkat global tetap: mencari nama tidak mengubah angka peringkat, hanya menyaring baris.
- Minimum match untuk rekor persentase (default 50, dapat diatur).
- Filter scope: active, inactive, girl group, liga, rentang season.
- Tie-break deterministik: nilai → jumlah match lebih sedikit (untuk persen) atau lebih banyak (untuk total) → season pertama tercapai → id idol.
- Kategori: most titles (per kompetisi dan total), most wins, best win rate, longest streaks, biggest upset (selisih rating terbesar), most reverse sweeps, most finals, most points in a league season, invincible seasons, most H2H meetings.

**7.4 Achievements (badges)**

| Badge | Syarat |
| --- | --- |
| Ultimate Bias | Juara kompetisi yang sama 4 season beruntun atau lebih |
| Hattrick Champion | Juara kompetisi yang sama 3 season beruntun |
| Back-to-Back Champion | Juara kompetisi yang sama 2 season beruntun |
| The Invincible | Satu season liga tanpa kalah (38 match) |
| Grand Slam Multi-Champion | Dalam satu season juara liga D1, Unzure Cup, dan The Idols |
| Dual Crown Champion | Dalam satu season juara 2 kompetisi berbobot ≥ 0,70 |
| Century Idols | 1.000 kemenangan karier |
| Half-Century | 500 kemenangan karier |
| Idol of The Season | Skor season tertinggi (§6.2) di season itu |
| Streak Master | 10+ kemenangan beruntun |
| Elite Tactician | Win rate ≥ 70% dengan minimal 200 match |
| Perennial Podium | 1.000+ podium (lihat catatan) |
| Point Machine | 5.000+ poin liga karier |
| League Titan | Juara liga D1 5 kali |

Catatan: seorang idol mendapat paling banyak ± 6 podium per season, sehingga 1.000 podium butuh > 150 season; usulan ambang 100. Usulan badge baru: Giant Killer (10 kemenangan atas lawan berselisih rating ≥ 15), Comeback Queen (5 reverse sweep), Rookie Sensation (juara di season pertama), Trainee to Star (promosi lalu juara D1 dalam 3 season).

Badge dihitung ulang setiap kompetisi selesai, disimpan di `achievements` (idolId, badge, seasonId, matchId bukti) dan dimunculkan sebagai popup perayaan.

## 8. Navigasi dan Panel

Navigasi dibagi tiga ruang: **Play** (menjalankan season), **Wiki** (membaca sejarah), dan **Studio** (mengelola data). Desktop memakai rail kiri yang bisa diciutkan; mobile memakai bottom bar 5 ikon (Home, Play, Wiki, Search, Studio) dan sheet untuk sub-menu. Ctrl/Cmd + K membuka command palette untuk mencari idol, group, kompetisi, atau perintah ("simulate matchday").

| Ruang | Panel |
| --- | --- |
| Play | Home, Dashboard, Sabung Idol, 9 panel kompetisi, Season Story |
| Wiki | Idol Database, Idol Profile, Girl Group Stats, Career Stats, Head to Head, Hall of Champions, All-time Records, Match Database, Season Archive |
| Studio | Input Data, Rating Manager, Inactive Manager, Settings |

**Home.** Layar pembuka sinematik: hero berisi foto besar juara Unzure Cup terakhir dengan nama season, lalu tiga kartu aksi ("Lanjutkan season" dengan progres %, "Match berikutnya" dengan dua foto, "Season Story terbaru"). Di bawahnya: carousel "On This Day" (match bersejarah dengan tanggal yang sama di season sebelumnya), idol dalam form On Fire, dan pintasan backup terakhir ("Backup terakhir 6 hari lalu"). Season pertama: Home berubah menjadi wizard onboarding.

**Dashboard.** Grid kartu yang bisa disusun ulang: season & fase aktif, progress bar per kompetisi, reigning champion setiap kompetisi (foto), idol dengan gelar terbanyak, top 5 rating (tier), form table, upset terbesar season ini, rekor yang baru pecah, distribusi rating (histogram), statistik girl group teratas, jumlah match tersimpan dan ukuran storage.

**Sabung Idol (Season Simulator).** Timeline fase season dengan status tiap kompetisi; tombol "Simulate Whole Season", "Simulate sampai fase berikutnya", dan "Pause". Progres berjalan live (counter match, kompetisi aktif) tanpa membekukan UI. Selesai → layar "Season Honours": grid juara semua kompetisi dengan foto besar dan KahootPodium untuk Unzure Cup.

**Panel kompetisi (9).** Setiap panel punya tab: Overview, Standings / Bracket, Fixtures, Stats, Roster. Kontrol simulasi: per match (klik match → Match Modal), per matchday / ronde, sampai akhir stage, semua. Liga: klasemen dengan zona warna (Unzure langsung, Swiss, degradasi / promosi), form 5 match, sparkline posisi. Unzure: Swiss grid, LCQ, animasi draw grup, 16 grup, bracket tree. Nugu: bracket 9 ronde dengan zoom dan mode "lihat jalur idol".

**Season Story.** Feed berita otomatis berbentuk kartu editorial: upset terbesar, reverse sweep, rekor pecah, streak, promosi dramatis, juara pertama kali, "Idol of the Month" per 10 matchday. Setiap kartu menautkan ke match asli. Usulan: headline digenerate dari template ("{A} menumbangkan {B} meski selisih rating {d}").

**Idol Database.** Grid kartu foto (default) atau tabel virtual; filter group, liga, tier, status, nationality; urut rating/nama/gelar. Upload foto massal dengan drag & drop. Aturan: nama sama dua kali tidak membuat dua idol; nama sama beda group = idol berbeda (warning); idol inactive tetap tampil dengan badge dan tersembunyi di tempat lain.

**Idol Profile.** Hero foto besar + group logo, rating & tier, form, nationality, umur, liga sekarang. Tab: Overview (badge, gelar, rating history chart), Career (stats §7.1 per kompetisi), Seasons (placement per season, jalur divisi), Matches (log berhalaman), Rivals (top H2H), Records (rekor yang dipegang). Tombol: edit, ganti foto, toggle active, bandingkan (buka H2H).

**Input Data.** Tiga cara: (1) paste batch — satu idol per baris dengan format bebas `Nama | Group | Rating | Seed | Nationality | YYYY-MM-DD`, kolom kosong boleh; (2) form manual satu idol; (3) import CSV/JSON. Semua lewat preview: baris hijau (baru), kuning (warning: nama sama beda group, rating di luar 0–100), merah (duplikat persis, ditolak). Foto: drop banyak file sekaligus, dicocokkan ke idol lewat nama file (fuzzy) dengan konfirmasi. Aksi per idol: replace photo, delete (konfirmasi + peringatan jika sudah punya match), toggle active, buka profil.

**Girl Group Stats.** Tabel group: jumlah member aktif, total gelar, win rate gabungan, member terbaik, rata-rata rating; halaman group dengan logo dan member grid.

**Career Stats.** "Spreadsheet legend": tabel virtual dengan kolom bisa diatur, sticky kolom foto+nama, tab Combined + satu tab per kompetisi, filter scope (§7.3), ekspor CSV.

**Head to Head.** Dua SearchableIdolSelect; foto berdampingan, rekor W-D-L, gelar, win rate, streak; "Heated Rivalries: Top 10 Most Matchups"; "Direct Match Log (N Matches)"; filter kompetisi dan season.

**Hall of Champions.** Satu tab per kompetisi: daftar juara per season (foto, runner-up, skor final), papan "most titles", dan wall of fame bergaya poster.

**All-time Records.** Kategori §7.3 dalam kartu leaderboard top 10 dengan tombol "lihat semua"; peringkat global stabil.

**Match Database.** Setiap match, dikelompokkan per kompetisi dan stage. Filter season, kompetisi, stage, idol, hasil; sorting, paging berbasis cursor, jumlah hasil, "Reset Filters". Tidak pernah memuat semua sekaligus. Match append-only (koreksi = match pengganti dengan tautan, bukan edit diam-diam).

**Season Archive.** Per season: honours, klasemen akhir 13 liga, Swiss grid, grup dan bracket Unzure, semua bracket cup, promosi/degradasi, perubahan rating, Season Story, dan statistik season. Read-only.

**Rating Manager.** Tabel rating editable (bulk edit dengan seleksi), filter scope; panel aksi §6.6; panel Engine Lab: pilih dua idol → peluang per game dan per BoN, simulasi 100 / 1.000 match dengan histogram skor. Aturan: tidak ada yang tertulis sebelum Save; aksi massal preview diff (lama → baru); Revert / Save Now / Discard dengan popup konfirmasi; riwayat rating disimpan.

**Inactive Manager.** Dua kolom Active / Inactive dengan drag & drop dan aksi massal; peringatan bila menonaktifkan idol yang ada di roster season berjalan (pilih pengganti otomatis atau manual).

**Settings.** Bagian: Season (nama, kompetisi aktif, BoN per stage), Branding kompetisi (nama, logo, warna aksen), Roster liga (LeagueRosterModal per liga), Data Maker & Pot Draw (auto-distribusi idol ke 12 liga berdasar seed/rating, preview pot), Engine Tuning, Data (backup/restore per bagian atau penuh, storage usage, Rebuild Stats), Danger Zone (Reset Season, Hapus semua data) dengan konfirmasi ketik. Archive guard: "Start New Season" diblokir selama ada kompetisi belum selesai dan menyebut namanya.

## 9. Komponen Bersama dan Popup

Semua komponen menerima `idolId`, bukan objek idol berisi foto; foto diambil lewat hook `useIdolPhoto(id, size)` dari cache.

| Komponen | Fungsi | Aturan penting |
| --- | --- | --- |
| MatchModal | Dua foto besar VS, nama, group, rating, form, peluang menang, H2H singkat | Tiga mode: Simulate, Manual score (validasi sesuai BoN), Wheel Picker; hasil baru tertulis setelah "Accept Result" |
| WheelPicker | Roda 50:50 dengan dua foto; diputar per game sampai seri selesai, skor terisi otomatis | Bisa "Spin all"; hasil tetap lewat Accept |
| LiveMatchVisualizer | Replay animasi per game seperti "pitch": bar dominasi bergerak, skor game muncul berurutan, highlight comeback | Bisa skip; prefers-reduced-motion → langsung skor |
| LeagueRosterModal | Tambah/hapus idol satu liga, paste nama | Tepat 20, tanpa duplikat, peringatan bila idol ada di liga lain; rebuild fixtures dan standings saat Apply |
| ManualGroupModal / ManualBracketModal | Pindah idol antar grup / edit slot bracket dengan drag | Validasi ulang constraint (§5.7) sebelum Apply; hanya sebelum stage dimulai |
| ResetSeasonModal | Menjelaskan apa yang dihapus (jumlah match, kompetisi), opsi redraw | Konfirmasi ketik nama season |
| TournamentBracketTree | Bracket single/double elimination, zoom & pan, highlight jalur idol | Virtualisasi untuk Nugu (239 match) |
| SwissPlayInBracket | Grid rekor 0–0, 1–0, 0–1, 2–0, 1–1 … 3–2 | Kolom per ronde, garis lolos/gugur |
| WildcardPlayInBracket | Tampilan legacy wildcard | Hanya untuk arsip lama |
| KahootPodium | Podium top 3 dengan animasi naik berurutan 3 → 2 → 1 | Foto 256 px di atas podium |
| FormBadge | Chip api (On Fire/Hot) atau es (Cold Slump) | Tooltip: 5 hasil terakhir |
| RatingBadge | Chip warna tier S/A/B/C/D + angka | Warna dari token tier |
| SearchableIdolSelect | Ketik untuk mencari, dengan foto 64 px | Keyboard penuh; dipakai di semua pemilih dua idol |
| ImportDialog | Pilih file → preview (jumlah, konflik, unknown) → "Confirm & Apply" | Import roster resolve idol via id lalu nama, laporkan unknown/duplikat |
| ConfirmDialog | Konfirmasi standar, varian "ketik untuk konfirmasi" | Tombol berbahaya berwarna merah, fokus default di Cancel |
| Toast & NotificationCenter | Notifikasi bertingkat (§14) | Riwayat tersimpan |

Usulan tambahan: **IdolCard** (foto, tier, form, gelar; dipakai di mana-mana), **StatTile** (angka besar + delta), **EmptyState** dengan ilustrasi garis tipis dan aksi berikutnya.

## 10. Look & Feel dan Design System

Arah visual: "majalah musik premium di ruang gelap" — latar espresso hangat, tipografi editorial, foto idol besar dan tajam sebagai bintang; tanpa gradient, neon glow, atau animasi berdenyut dekoratif.

**10.1 Token warna (usulan awal, diaudit kontras WCAG AA saat build)**

| Token | Hex | Pemakaian |
| --- | --- | --- |
| bg-base | #15100D | Latar aplikasi |
| bg-raised | #1E1612 | Rail, header |
| surface | #261C17 | Kartu, tabel |
| surface-hover | #30241D | Hover, baris terpilih |
| border | #3E3028 | Garis 1 px |
| text-primary | #F4EBE1 | Teks utama (krem hangat) |
| text-secondary | #BDAA98 | Label, metadata |
| accent-gold | #E9B44C | Juara, CTA utama, tier S |
| accent-coral | #F07A5A | Highlight, tier A, live |
| accent-sage | #8EC39A | Menang, tier B |
| accent-sky | #7FB0D9 | Info, tier C |
| neutral-taupe | #9C8B7C | Tier D, seri |
| danger | #E5615A | Kalah, error, aksi berbahaya |

Warna kompetisi (branding) dipilih user dari palet terkurasi 12 warna agar tetap harmonis.

**10.2 Tipografi.** Display: Fraunces (serif editorial, untuk judul halaman dan nama juara). UI: Geist (sans). Angka: Geist Mono dengan tabular-nums untuk skor dan tabel. Skala 12 / 14 / 16 / 20 / 28 / 40 / 64.

**10.3 Foto.** Rasio potret 4:5, object-fit cover dengan focal point yang bisa diatur user saat upload (disimpan di record foto). Ukuran: 64 px (list), 256 px (kartu), 1024 px (hero/profil/match modal). Placeholder: inisial nama di atas warna group, bukan siluet generik. Foto tidak pernah diberi filter warna; overlay teks memakai panel solid gelap di bawah foto, bukan gradient.

**10.4 Layout.** Grid 12 kolom desktop, 4 kolom mobile; spasi kelipatan 8; radius 12 (kartu) dan 8 (kontrol); breakpoints 640 / 1024 / 1440. Tabel lebar di mobile berubah jadi kartu bertumpuk dengan kolom kunci.

**10.5 Motion.** Animasi bermakna dan menyambung: kartu idol → profil memakai shared-element transition; klik match → modal tumbuh dari baris match; hasil skor masuk berurutan; podium naik berurutan. Durasi 160–320 ms, easing spring lembut, hanya transform/opacity (GPU). Tidak ada animasi berulang tanpa interaksi. `prefers-reduced-motion` menggantinya dengan fade 100 ms.

**10.6 Ikon dan ilustrasi.** Satu set ikon garis (Lucide), stroke 1,5. Trofi tiap kompetisi digambar sebagai ikon garis sederhana yang bisa diwarnai sesuai branding.

## 11. Arsitektur Teknis dan Tech Stack

Rekomendasi: aplikasi **local-first** — Postgres berjalan di browser (PGlite) dengan Drizzle ORM, sehingga skema yang sama dipakai lokal dan di cloud; backend (Better Auth + Supabase Postgres) hanya untuk fitur opsional cloud backup dan sync, bukan syarat memakai aplikasi.

Alasannya: brief meminta data tersimpan di browser, tetapi juga Drizzle + Postgres + Better Auth. PGlite (Postgres yang dikompilasi ke WASM, persisten di IndexedDB) menjembatani keduanya: query statistik ditulis sekali dalam SQL Drizzle dan berjalan di kedua tempat.

| Lapisan | Pilihan | Catatan |
| --- | --- | --- |
| Framework | TanStack Start (React 19) mode SPA + SSR untuk halaman publik | Alternatif: Next.js App Router; TanStack dipilih karena routing type-safe dan ramah Cloudflare Workers |
| Routing & data | TanStack Router, TanStack Query, TanStack Table, TanStack Virtual | Tabel besar dan bracket divirtualisasi |
| State UI | Zustand (UI state ringan) | Data domain tetap di DB, bukan di store |
| Styling | Tailwind CSS v4 + token CSS variables, primitive Radix UI / shadcn/ui | Token dari §10 |
| Animasi | Motion (Framer Motion) | layout & shared-element transitions |
| Chart | visx atau uPlot (ringan) | Rating history, histogram, sparkline |
| DB lokal | PGlite + Drizzle ORM (driver pglite), persist IndexedDB | Jalankan di Worker agar UI tidak terblok |
| Foto | OPFS (Origin Private File System), fallback IndexedDB blob | Thumbnail WebP dibuat di Worker via OffscreenCanvas |
| Engine | Paket TS murni + Comlink di Web Worker | Vitest + property-based test (fast-check) |
| Validasi | Zod di setiap boundary (import, form, API) | Satu skema dibagi frontend/backend |
| PWA | Service worker (Workbox), installable di Windows & mobile | Bekerja offline penuh |
| Auth (opsional) | Better Auth (email/password, magic link, Google) dengan Drizzle adapter | Hanya untuk cloud backup |
| DB cloud | Supabase Postgres via Drizzle | Row Level Security per user |
| Storage cloud | Supabase Storage atau Cloudflare R2 | Foto dan file backup |
| Deploy | Cloudflare Workers/Pages (frontend + API), Hyperdrive ke Supabase | Alternatif: semua di Supabase + Vercel |
| Observability | Sentry (opsional, opt-in) + error log lokal | §14 |

**Struktur monorepo (pnpm + Turborepo)**

- `apps/web` — TanStack Start app.
- `packages/engine` — simulator, scheduler, solver (tanpa dependensi UI).
- `packages/db` — skema Drizzle, migrasi, query statistik.
- `packages/ui` — design system dan komponen bersama.
- `packages/shared` — Zod schema, tipe, konstanta kompetisi.

**Urutan pembangunan sesuai brief:** frontend dulu (dengan engine dan DB lokal), lalu backend (auth + cloud backup), lalu integrasi (sync). Engine dibangun dan dites sebelum UI pertama.

## 12. Penyimpanan, Backup, dan Skema Data

Semua data hidup di browser user; saat pertama dibuka aplikasi meminta `navigator.storage.persist()` agar browser tidak menghapus data saat storage penuh, dan menampilkan notifikasi bila izin ditolak.

**12.1 Tabel inti (Drizzle, sama di lokal dan cloud)**

| Tabel | Kunci & kolom utama | Catatan |
| --- | --- | --- |
| idols | id, name, group\_id, seed, nationality, birthday, photo\_id, rating, active | unique(lower(name), group\_id) |
| groups | id, name, logo\_id |  |
| photos | id, focal\_x, focal\_y, sizes, bytes | Blob di OPFS, bukan di tabel |
| seasons | id, number, name, seed, status, config (jsonb) | config = kompetisi aktif, BoN |
| competitions | season\_id, code, name, branding | Snapshot branding per season |
| entries | season\_id, comp, stage, idol\_id, slot, seed\_rank, source | Roster/peserta per stage |
| matches | id (PK deterministik), season\_id, comp, stage, round, idol\_a, idol\_b, games (smallint bitmask), score\_a, score\_b, result, method, rating\_a, rating\_b, form\_a, form\_b, played\_at | Append-only, unique PK mencegah double submit |
| placements | season\_id, comp, idol\_id, final\_rank, stage\_reached | Sumber gelar & podium |
| rating\_history | idol\_id, season\_id, old, new, source, reason, at |  |
| achievements | idol\_id, badge, season\_id, evidence\_match\_id |  |
| stats\_cache | key, scope, payload, built\_from\_rev | Bisa dihapus & dibangun ulang |
| event\_log | id, level, code, message, context, at | Error & notifikasi |

Index: matches(season\_id, comp, stage), matches(idol\_a), matches(idol\_b), placements(idol\_id). Klasemen tidak disimpan sebagai array; dihitung dari matches (dengan cache per matchday).

**12.2 Estimasi ukuran.** ± 5.600 match per season × ± 120 byte = ± 0,7 MB per season; 20 season ± 14 MB + index. Foto: 1024 px WebP ± 120 KB + 256 px ± 15 KB + 64 px ± 2 KB ≈ 140 KB per idol.

**12.3 Backup & restore**

- Format `.sabung` = ZIP berisi `manifest.json` (versi skema, tanggal, jumlah baris per tabel, checksum), `data/*.ndjson` per tabel, dan `photos/` (opsional).
- Ekspor per bagian: Idols + foto, Roster & settings, Season tertentu, Rating, Full backup.
- Import dua langkah: pilih file → preview (apa yang ditambah/diganti/konflik) → "Confirm & Apply"; mode Merge atau Replace.
- Migrasi skema otomatis saat import backup versi lama; backup dari versi lebih baru ditolak dengan pesan jelas.
- Pengingat backup: notifikasi bila belum backup > 7 hari atau setelah season selesai.
- Auto-snapshot lokal sebelum setiap aksi berbahaya (reset, import Replace, Sync rating), disimpan 3 terakhir.

**12.4 Cloud (opsional, fase 3).** Login Better Auth → "Backup ke cloud" mengunggah file `.sabung` ke storage dan mencatat metadata di Postgres; device lain login → pilih backup → restore. Sync dua arah otomatis tidak termasuk v1.

## 13. Performa dan Optimisasi

Performa adalah fitur utama: setiap target di bawah punya tes otomatis di CI, dan build gagal bila terlampaui.

| Metrik | Target |
| --- | --- |
| Bundle JS awal (gzip) | < 180 KB (PGlite & engine dimuat lazy di Worker) |
| First load / LCP (4G menengah) | < 2,0 s; buka ulang dari cache < 0,8 s |
| Interaksi (INP) | < 150 ms |
| Simulasi satu matchday 13 liga (130 match) | < 300 ms |
| Simulasi season penuh | < 10 s, progres update tiap 100 ms |
| Scroll tabel 240 idol / log 10.000 match | 60 fps (virtualisasi) |
| Memori tab | < 300 MB setelah 20 season |

**Teknik**

- Semua simulasi, query statistik berat, dan pembuatan thumbnail di Web Worker; UI hanya menerima hasil.
- Tulis ke DB dalam transaksi batch per matchday/ronde, bukan per match.
- Foto: `<img loading="lazy" decoding="async">` dengan ukuran yang tepat (64/256/1024), object URL di-cache per idolId dan di-revoke saat tidak dipakai.
- Statistik: cache inkremental per kompetisi selesai; Career Stats dan Records membaca cache, invalidasi oleh revisi tabel matches.
- Match Database dan log memakai paging cursor (keyset pagination), tidak pernah `SELECT *`.
- Route-level code splitting; bracket Nugu dan chart dimuat saat dibuka.
- Animasi hanya transform/opacity; daftar panjang tanpa animasi per item saat > 50 item.
- Mode "Fast Sim" melewati LiveMatchVisualizer dan animasi saat simulasi massal.

## 14. Notifikasi, Error Handling, dan Guardrails

Aturan umum: setiap kondisi yang bisa merusak data atau membingungkan user muncul sebagai notifikasi sebelum user bertindak, dan setiap error menampilkan apa yang gagal, di mana, dan apa langkah berikutnya.

**14.1 Tingkat notifikasi**

| Level | Tampilan | Contoh |
| --- | --- | --- |
| Info | Toast 4 detik | "Matchday 12 selesai di 13 liga" |
| Success | Toast + aksi Undo bila memungkinkan | "240 idol ditambahkan" |
| Warning | Banner di panel terkait, tetap sampai ditangani | "Mina ada di Liga D1-A dan D2-C" |
| Blocker | Dialog yang mencegah aksi, menyebut penyebab | "Start New Season diblokir: Nugu Cup belum selesai (R6)" |
| Error | Panel error dengan kode, pesan, konteks, tombol "Salin laporan" | "E-DRAW-002: grup H hanya 3 idol" |

Semua notifikasi tersimpan di NotificationCenter (ikon lonceng) dan event\_log, bisa difilter dan diekspor.

**14.2 Error & crash**

- Error boundary per route: satu panel crash tidak menjatuhkan aplikasi; tampil kartu "Panel ini gagal dimuat" + kode + tombol Reload panel dan Salin laporan (stack, versi, route, aksi terakhir).
- Worker crash: simulasi dihentikan pada batas transaksi terakhir (tidak ada match setengah tertulis), user diberi opsi lanjutkan.
- Integrity check saat startup dan dari Settings: match yatim, roster ≠ 20, klasemen tak cocok, foto hilang, duplikat nama; hasil berupa daftar dengan tombol "Perbaiki".
- Storage hampir penuh (> 80% kuota): peringatan + saran backup dan hapus foto ukuran asli.

**14.3 Notifikasi wajib (daftar awal)**

- Nama sama di dua liga berbeda saat input roster; nama sama beda group (warning); duplikat persis (ditolak).
- Liga tidak tepat 20 idol; idol inactive di roster aktif; idol tanpa foto.
- Kuota Swiss/Unzure tidak bisa dipenuhi; solver Swiss/draw jatuh ke fallback.
- Idol yang sama juara di dua sisi Daesang/Music Bank.
- Kompetisi dinonaktifkan padahal kompetisi lain bergantung padanya.
- Import: idol tidak dikenal, duplikat, versi skema berbeda.
- Backup belum dibuat > 7 hari; izin persistent storage ditolak.
- Rating di luar 0–100 atau perubahan massal > 10 poin.

**14.4 Pelajaran dari bug lama → guardrail**

| Bug lama | Guardrail di rebuild | Tes |
| --- | --- | --- |
| Foto tertanam di record (51 MB vs 2,5 MB per season) | Foto hanya di tabel photos + OPFS, record hanya idolId; lint rule melarang field `*Photo`/`photoUrl` di skema match/entry | Ukuran backup season tanpa foto < 1 MB |
| Match terduplikasi di DB pusat, arsip, dan state live | Satu tabel matches; arsip dan live adalah query | Jumlah match identik di semua tampilan |
| Classifier tersebar (`stage.includes('matchday')` menggandakan 38 jadi 76) | Satu fungsi `classifyMatch(id)` berbasis prefix | Liga D1 tepat 38 match per idol |
| Swiss diisi peringkat 1–6 | Larangan keras padding dengan direct qualifier; selalu sort ulang klasemen; rebuild daftar Swiss basi | Property test: tidak ada idol peringkat ≤ 6 di Swiss |
| Import roster mengganti id member tanpa fixtures/standings | Import roster = transaksi: resolve idol, rebuild fixtures & standings, laporan unknown/duplikat | Roster muncul di semua panel setelah import |
| Double submit menulis match grup dua kali | Id match deterministik + PK unik; tombol submit dikunci saat proses; tulis idempoten (upsert ditolak bila sudah ada) | Dua kali submit = satu baris |

## 15. Roadmap, Acceptance Criteria, dan Testing

Pembangunan berjalan dalam 6 fase berurutan; setiap fase punya gate yang harus lulus sebelum fase berikutnya dimulai. Durasi belum ditetapkan.

1. **Fase 0 — Engine & Data Core.** Monorepo, skema Drizzle + PGlite di Worker, engine (probabilitas, BoN, form, scheduler round robin, Swiss solver, group draw, bracket templates, Nugu solver), classifier id match.
   - Gate: semua acceptance test §5.10 lulus; satu season penuh tersimulasi headless < 10 s dan statistik cocok dengan hitungan manual.
2. **Fase 1 — Design System & Shell.** Token §10, komponen §9 di Storybook, layout desktop/mobile, navigasi, command palette, NotificationCenter, error boundary.
   - Gate: audit kontras AA lulus; Lighthouse performa ≥ 90 di shell.
3. **Fase 2 — Studio.** Input Data (paste batch + foto massal), Idol Database, Settings (roster, branding, Data Maker), backup/restore lokal.
   - Gate: 240 idol + foto masuk < 5 menit; backup → restore di browser lain identik (checksum).
4. **Fase 3 — Play.** Sabung Idol, 9 panel kompetisi, MatchModal + WheelPicker + LiveMatchVisualizer, archive guard, promosi/degradasi, Rating Manager + Engine Lab.
   - Gate: 3 season berturut-turut tanpa error integrity; tidak ada match ganda.
5. **Fase 4 — Wiki.** Dashboard, Home, Idol Profile, Career Stats, H2H, Hall of Champions, Records, Match DB, Season Archive, Season Story, achievements.
   - Gate: "Rebuild Stats" menghasilkan angka identik dengan cache pada data 20 season sintetis.
6. **Fase 5 — Backend & Integrasi.** Better Auth, Supabase Postgres + RLS, cloud backup/restore, deploy Cloudflare, PWA install.
   - Gate: backup cloud dari device A dipulihkan di device B; aplikasi tetap 100% fungsional offline tanpa login.

**Strategi testing**

- Unit & property-based (Vitest + fast-check) untuk engine, comparator klasemen, solver, statistik.
- Golden tests: seed tetap → snapshot hasil season; perubahan engine yang tidak disengaja langsung terlihat.
- Integration: query Drizzle di PGlite dengan dataset sintetis 20 season.
- E2E (Playwright) di Chromium, WebKit, dan viewport mobile: onboarding, simulate season, backup/restore, import roster.
- Visual regression komponen Storybook.
- Performance budget di CI (§13).

**Definition of Done per fitur:** tes lulus, notifikasi untuk kasus error ada, keyboard & screen reader dasar berjalan, tampil benar di 375 px dan 1440 px, tidak menambah bundle awal > 10 KB tanpa alasan.

## 16. Ide Tambahan, Risiko, dan Open Questions

**Ide tambahan (prioritas setelah v1 kecuali ditandai)**

- **Seeded seasons & replay (v1):** setiap season punya seed; user bisa membagikan seed untuk menghasilkan season identik.
- **Season Recap card:** gambar 1080 × 1350 berisi juara semua kompetisi untuk dibagikan ke media sosial (render di canvas, lokal).
- **Rivalry system:** pasangan dengan ≥ 10 pertemuan dan selisih menang ≤ 2 otomatis diberi label "Rivalry" dan sorotan di MatchModal.
- **Transfer window / draft:** antar season user bisa menukar idol antar liga D1 dengan aturan kuota.
- **Retirement & debut:** idol bisa "pensiun" (inactive dengan upacara Hall of Fame) dan idol baru masuk lewat D2.
- **Prediksi user:** sebelum final, user menebak pemenang; akurasi tercatat sebagai statistik Commissioner.
- **Undo terakhir (v1):** membatalkan simulasi matchday terakhir sebelum stage dikunci (menghapus match batch terakhir dengan jejak di event\_log).
- **Tema terang opsional** untuk siang hari dengan token yang sama.

**Risiko**

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Browser menghapus data (eviction, Safari 7 hari tanpa kunjungan untuk situs non-PWA) | Kehilangan semua sejarah | persistent storage, install PWA, pengingat backup, auto-snapshot |
| Ukuran & waktu muat PGlite (WASM beberapa MB) | Load pertama lambat | Lazy load di Worker, cache service worker, fallback Dexie/IndexedDB bila perlu |
| Simulasi 5.600 match + tulis DB terlalu lambat di HP lama | UI tersendat | Batch transaksi, Fast Sim, progres bertahap |
| Formula rating membuat dinasti beku | Season membosankan | Regresi > 92, batas ±6, Breakout/Slump, preset Chaotic |
| Hak foto idol | Masalah bila dibagikan publik | Foto hanya lokal milik user; tidak ada galeri publik |

**Open questions**

- [x] Apakah idol The Idols juga tetap bermain di liga asalnya (asumsi dokumen: ya)?
- [x] Pemetaan nama turnamen lama (Supreme, Crown, Champion Shield, Open Arena, Spotlight) ke kompetisi baru di §6.1 sudah benar?
- [x] Nugu Cup: terima bye 1–2 ronde (rencana §4), atau ubah jumlah ronde/peserta agar bye 3–4 ronde mungkin?
- [x] LCQ: 4 teratas per grup (total 8, agar Unzure Cup tepat 64)?
- [ ] Daesang & Music Bank dimainkan di akhir season ini atau sebagai pembuka season berikutnya?
- [ ] Ambang Perennial Podium tetap 1.000 atau diturunkan ke 100?
- [x] Urutan tie-break klasemen §5.5 disetujui?
