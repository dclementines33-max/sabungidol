// The HTML document around every screen, and the shell inside it.
import { EmptyState } from "@sabung/ui";
import { HeadContent, Link, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "../components/shell/AppShell";
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
  component: () => <AppShell><Outlet /></AppShell>,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
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
      action={<Link to="/" className="text-sm text-accent-gold underline underline-offset-4">Kembali ke Home</Link>}
    />
  );
}
