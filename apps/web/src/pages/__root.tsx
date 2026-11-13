// The HTML document around every screen, and the shell inside it.
import { EmptyState } from "@sabung/ui";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "../components/shell/AppShell";
import { EARLY_INPUT_SCRIPT } from "../components/shell/earlyInput";
import { IdolDataProvider } from "../data/IdolDataProvider";
import { queryClient } from "../data/queryClient";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Sabung Idol" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
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
    <html lang="id">
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
      title="Halaman tidak ditemukan"
      description="Alamat ini tidak ada di Sabung Idol."
      action={<Link to="/" className="text-sm text-accent-bright underline underline-offset-4">Kembali ke Home</Link>}
    />
  );
}
