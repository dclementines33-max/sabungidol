// The frame around every screen (agreed shell, Fase 1 step 7): skip link, rail, header, content, bottom bar.
import type { ReactNode } from "react";
import { useRememberedFlag } from "../../data/rememberedFlag";
import { BottomBar } from "./BottomBar";
import { Header } from "./Header";
import { NavRail } from "./NavRail";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useRememberedFlag("sabung.railCollapsed");
  return (
    <>
      <a
        href="#konten"
        className="sr-only rounded-control bg-accent-gold px-4 py-2 text-on-fill focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Langsung ke konten
      </a>
      <div className="flex min-h-dvh">
        <NavRail collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main id="konten" tabIndex={-1} className="flex-1 px-4 pt-4 pb-24 focus:outline-none sm:pb-8 md:px-8">
            {children}
          </main>
        </div>
      </div>
      <BottomBar />
    </>
  );
}
