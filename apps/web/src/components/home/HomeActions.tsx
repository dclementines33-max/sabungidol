// Home's three action cards (PRD §8): continue the season (progress %), the next match (two photos), and the
// latest Season Story headline.
import type { Story } from "@sabung/engine";
import { IdolPhoto, useIdol } from "@sabung/ui";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StoryCard } from "../story/StoryCard";

const CARD = "flex h-full flex-col gap-3 rounded-card border border-border bg-bg-raised p-4 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright";

function Card({ to, kicker, children }: { to: "/play" | "/story"; kicker: string; children: ReactNode }) {
  return <Link to={to} className={CARD}><span className="text-xs tracking-widest text-text-secondary uppercase">{kicker}</span>{children}</Link>;
}

function Name({ id }: { id: string }) {
  return <span className="truncate">{useIdol(id).name}</span>;
}

export function HomeActions({ progress, status, next, story }: { progress: number; status: string; next: { a: string; b: string; comp: string; round: string } | null; story?: Story }) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
      <li>
        <Card to="/play" kicker={status === "draft" ? "Mulai season" : "Lanjutkan season"}>
          <span className="font-mono text-3xl">{Math.round(progress * 100)}%</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true"><span className="block h-full bg-accent-bright" style={{ width: `${progress * 100}%` }} /></span>
          <span className="text-sm text-text-secondary">kompetisi selesai</span>
        </Card>
      </li>
      <li>
        <Card to="/play" kicker="Match berikutnya">
          {next ? (
            <span className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
              <span className="flex flex-col items-center gap-1"><IdolPhoto idolId={next.a} size={256} className="w-16" /><Name id={next.a} /></span>
              <span className="font-display text-text-secondary">vs</span>
              <span className="flex flex-col items-center gap-1"><IdolPhoto idolId={next.b} size={256} className="w-16" /><Name id={next.b} /></span>
              <span className="col-span-3 text-center font-mono text-xs text-text-secondary">{next.comp} · {next.round}</span>
            </span>
          ) : <span className="text-sm text-text-secondary">Tidak ada match yang menunggu.</span>}
        </Card>
      </li>
      <li className="flex">{story ? <StoryCard story={story} /> : <Card to="/story" kicker="Season Story terbaru"><span className="text-sm text-text-secondary">Belum ada berita.</span></Card>}</li>
    </ul>
  );
}
