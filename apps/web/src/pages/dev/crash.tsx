// Fase 1 check (not in the menu): a panel that always crashes, to see the error boundary (PRD §14.2).
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dev/crash")({
  component: () => {
    throw new Error("Panel uji sengaja gagal (Fase 1, langkah 12)");
  },
});
