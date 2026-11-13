// Home's three action cards (PRD §8): continue the season (progress %), the next match (two photos), and the
// latest Season Story headline.
import type { Story } from "@sabung/engine";
import { IdolPhoto, useIdol } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StoryCard } from "../story/StoryCard";

const CARD = "flex h-full flex-col gap-3 panel p-4 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright";

function Card({ to, kicker, children }: { to: "/play" | "/story"; kicker: string; children: ReactNode }) {
  return <Link to={to} className={CARD}><span className="kicker">{kicker}</span>{children}</Link>;
}

function Name({ id }: { id: string }) {
  return <span className="truncate">{useIdol(id).name}</span>;
}

export function HomeActions({ progress, status, next, story }: { progress: number; status: string; next: { a: string; b: string; comp: string; round: string } | null; story?: Story }) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-[1fr_1.3fr_1fr]">
      <li>
        <Card to="/play" kicker={status === "draft" ? "Mulai season" : "Lanjutkan season"}>
          <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none">{Math.round(progress * 100)}<span className="text-2xl">%</span></span>
          <span className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true"><span className="block h-full bg-accent-bright" style={{ width: `${progress * 100}%` }} /></span>
          <span className="text-sm text-text-secondary">kompetisi selesai</span>
        </Card>
      </li>
      <li>
        <Card to="/play" kicker="Match berikutnya">
          {next ? (
            <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <span className="flex min-w-0 flex-col items-center gap-1"><IdolPhoto idolId={next.a} size={256} className="torn w-24" /><Name id={next.a} /></span>
              <span className="font-gothic text-2xl text-accent-bright">vs</span>
              <span className="flex min-w-0 flex-col items-center gap-1"><IdolPhoto idolId={next.b} size={256} className="torn w-24" /><Name id={next.b} /></span>
              <span className="col-span-3 text-center font-mono text-xs text-text-secondary">{next.comp} · {next.round}</span>
            </span>
          ) : <span className="text-sm text-text-secondary">Tidak ada match yang menunggu.</span>}
        </Card>
      </li>
      <li className="flex">{story ? <StoryCard story={story} /> : <Card to="/story" kicker="Season Story terbaru"><span className="text-sm text-text-secondary">Belum ada berita.</span></Card>}</li>
    </ul>
  );
}
