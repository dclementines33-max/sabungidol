// What "Salin laporan" copies (PRD §14.2): code, message, route, app version, the user's last
// action, time and stack — enough to understand a failure without access to the user's browser.
let lastAction = "—";
let tracking = false;

// Remember the last button, link or option the user clicked.
export function trackLastAction(): void {
  if (tracking || typeof window === "undefined") return;
  tracking = true;
  window.addEventListener("click", (event) => {
    const el = (event.target as Element | null)?.closest?.("button, a, [role=option]");
    if (!el) return;
    const label = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 60);
    lastAction = `${el.tagName.toLowerCase()} "${label}"`;
  }, { capture: true });
}

const version = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "dev";

export function errorReport({ code, error, route }: { code: string; error: unknown; route: string }): string {
  const err = error instanceof Error ? error : new Error(String(error));
  return [
    `${code}: ${err.message}`,
    `Rute: ${route}`,
    `Versi: ${version}`,
    `Aksi terakhir: ${lastAction}`,
    `Waktu: ${new Date().toISOString()}`,
    `Browser: ${typeof navigator === "undefined" ? "?" : navigator.userAgent}`,
    "",
    err.stack ?? "(tanpa stack)",
  ].join("\n");
}
