// The HTML document around every screen, and the shell inside it.
import { EmptyState } from "@sabung/ui";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { SearchX } from "@sabung/ui/icons";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "../components/shell/AppShell";
import { EARLY_INPUT_SCRIPT } from "../components/shell/earlyInput";
import { IdolDataProvider } from "../data/IdolDataProvider";
import { queryClient } from "../data/queryClient";
import appCss from "../styles.css?url";

// PWA: the service worker (scripts/serviceWorker.mjs) exists only in the production build.
if (import.meta.env.PROD && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  // An update (not the first install) swaps the cached files, so reload onto the new version.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => hadController && location.reload());
  void navigator.serviceWorker.register("/sw.js");
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Sabung Idol" },
      { name: "theme-color", content: "#010003" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "manifest", href: "/manifest.webmanifest" }, { rel: "icon", href: "/icon.svg" }],
  }),
  shellComponent: RootDocument,
  component: () => (
    <QueryClientProvider client={queryClient}>
      <IdolDataProvider>
        <AppShell><Outlet /></AppShell>
      </IdolDataProvider>
    </QueryClientProvider>
  ),
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: EARLY_INPUT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="This address doesn't exist in Sabung Idol."
      action={<Link to="/" className="text-sm text-accent-bright underline underline-offset-4">Back to Home</Link>}
    />
  );
}
