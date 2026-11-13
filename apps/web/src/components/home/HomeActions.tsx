// Home's action cards (PRD §8; Update 2 dropped the next match): continue the season (progress %) and the latest
// Season Story headline.
import type { Story } from "@sabung/engine";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { StoryCard } from "../story/StoryCard";

const CARD = "flex h-full flex-col gap-3 panel p-4 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent-bright";

function Card({ to, kicker, children }: { to: "/play" | "/story"; kicker: string; children: ReactNode }) {
  return <Link to={to} className={CARD}><span className="kicker">{kicker}</span>{children}</Link>;
}

export function HomeActions({ progress, status, story }: { progress: number; status: string; story?: Story }) {
  return (
    <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-[1fr_1.6fr]">
      <li>
        <Card to="/play" kicker={status === "draft" ? "Mulai season" : "Lanjutkan season"}>
          <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none">{Math.round(progress * 100)}<span className="text-2xl">%</span></span>
          <span className="h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true"><span className="block h-full bg-accent-bright" style={{ width: `${progress * 100}%` }} /></span>
          <span className="text-sm text-text-secondary">kompetisi selesai</span>
        </Card>
      </li>
      <li className="flex">{story ? <StoryCard story={story} /> : <Card to="/story" kicker="Season Story terbaru"><span className="text-sm text-text-secondary">Belum ada berita.</span></Card>}</li>
    </ul>
  );
}
