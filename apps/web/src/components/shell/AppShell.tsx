// The frame around every screen (agreed shell, Fase 1 step 7): skip link, rail, header, content, bottom bar,
// plus the notification layers (PRD §14.1): pinned warnings/errors, toasts, blocker dialog.
import { BlockerDialog, Toasts } from "@sabung/ui";
import { type ReactNode, useEffect, useState } from "react";
import { trackLastAction } from "../../data/errorReport";
import { useNotices } from "../../data/notices";
import { useRememberedFlag } from "../../data/rememberedFlag";
import { startDefaultData } from "../../data/startDefaultData";
import { startNotifications } from "../../data/startNotifications";
import { BottomBar } from "./BottomBar";
import { CommandPalette } from "./CommandPalette";
import { Header } from "./Header";
import { NavRail } from "./NavRail";
import { DatabaseResetOffer } from "./DatabaseResetOffer";
import { replayEarlyInput } from "./earlyInput";
import { PinnedNotices } from "./PinnedNotices";
import { SimTimeline } from "../play/SimTimeline";
import { GrandFinalCelebration } from "../play/GrandFinalCelebration";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useRememberedFlag("sabung.railCollapsed");
  const toasts = useNotices((s) => s.toasts);
  const dismissToast = useNotices((s) => s.dismissToast);
  const blocker = useNotices((s) => s.blocker);
  const closeBlocker = useNotices((s) => s.closeBlocker);
  const markRead = useNotices((s) => s.markRead);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useEffect(startNotifications, []);
  useEffect(trackLastAction, []);
  useEffect(startDefaultData, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); // the browser's own Ctrl+K would focus its address bar
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => replayEarlyInput(() => setPaletteOpen(true)), []);
  const openPalette = () => setPaletteOpen(true);
  const runCommand = (command: string) => {
    if (command === "toggle-rail") setCollapsed(!collapsed);
    else if (command === "mark-read") markRead();
  };
  return (
    <>
      <a
        href="#content"
        className="sr-only rounded-control bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh">
        <NavRail collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onSearch={openPalette} />
          <main id="content" tabIndex={-1} className="flex-1 px-4 pt-4 pb-24 focus:outline-none sm:pb-8 md:px-8">
            <PinnedNotices />
            <DatabaseResetOffer />
            {children}
          </main>
        </div>
      </div>
      <BottomBar onSearch={openPalette} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onCommand={runCommand} />
      <Toasts notices={toasts} onDismiss={dismissToast} />
      <BlockerDialog notice={blocker} onClose={closeBlocker} />
      <SimTimeline />
      <GrandFinalCelebration />
    </>
  );
}
