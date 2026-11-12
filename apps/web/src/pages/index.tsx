// Home (PRD §8). Placeholder until the shell is built (Fase 1 step 8).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <h1 className="font-display text-3xl">Sabung Idol</h1>;
}
