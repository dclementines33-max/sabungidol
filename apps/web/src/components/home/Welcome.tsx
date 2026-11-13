// Home on the first run (PRD §2 onboarding, §8 Home): the default idols and Season 1 are already
// there, so the welcome says what is ready and where each next step lives. Starting the season
// comes with Play (Fase 3).
import { StatTile } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import { ArrowRight, DatabaseBackup, Image, Settings, Users } from "lucide-react";
import type { ReactNode } from "react";

const STEPS: { to: "/wiki/idols" | "/studio/input" | "/studio/settings"; icon: typeof Users; title: string; text: string }[] = [
  { to: "/wiki/idols", icon: Users, title: "Periksa idol", text: "Lihat semua idol, rating dan liganya." },
  { to: "/studio/input", icon: Image, title: "Tambah idol & foto", text: "Paste daftar idol, atau seret foto yang lebih tajam." },
  { to: "/studio/settings", icon: Settings, title: "Atur season & liga", text: "Nama season, kompetisi, Best of N, roster dan branding." },
  { to: "/studio/settings", icon: DatabaseBackup, title: "Restore dari backup", text: "Punya file .sabung? Impor di Settings → Backup." },
];

export function Welcome({ seasonName, idols, leagues, reserves }: { seasonName: string; idols: number; leagues: number; reserves: number }): ReactNode {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="m-0 text-xs tracking-widest text-text-secondary uppercase">Selamat datang</p>
        <p className="m-0 font-display text-3xl leading-tight font-semibold uppercase md:text-[64px]">{seasonName} siap disusun.</p>
        <p className="m-0 max-w-2xl text-text-secondary">Data idol bawaan sudah dimuat dan dibagi ke 12 liga. Periksa dulu, ubah yang perlu, lalu mainkan season di Play (Fase 3).</p>
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Idol" value={idols} />
        <StatTile label="Liga" value={leagues} />
        <StatTile label="Cadangan" value={reserves} />
        <StatTile label="Status" value="Draft" />
      </div>
      <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-2">
        {STEPS.map(({ to, icon: Icon, title, text }) => (
          <li key={title}>
            <Link to={to} className="group flex h-full items-start gap-4 panel bg-surface p-4 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright">
              <Icon aria-hidden="true" size={24} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent-bright" />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-lg">{title}</span>
                <span className="block text-sm text-text-secondary">{text}</span>
              </span>
              <ArrowRight aria-hidden="true" size={20} strokeWidth={1.5} className="mt-1 shrink-0 text-text-secondary group-hover:text-text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
