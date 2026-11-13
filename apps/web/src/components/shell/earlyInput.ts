// Clicks and Ctrl+K before React has taken over the prerendered page used to do nothing (Fase 1
// open item). An inline script queues them; once the shell has hydrated they are replayed (React
// keeps the same DOM nodes, so a queued button can simply be clicked again). Links work without JS.
declare global { interface Window { __early?: (HTMLElement | "palette")[] } }

export const EARLY_INPUT_SCRIPT = `window.__early=[];
addEventListener("click",function(e){if(document.documentElement.dataset.hydrated)return;var b=e.target.closest&&e.target.closest("button");if(b){e.preventDefault();window.__early.push(b)}},true);
addEventListener("keydown",function(e){if(!document.documentElement.dataset.hydrated&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();window.__early.push("palette")}},true);`;

export function replayEarlyInput(openPalette: () => void) {
  document.documentElement.dataset.hydrated = "1";
  const early = window.__early ?? [];
  window.__early = [];
  for (const item of early) {
    if (item === "palette") openPalette();
    else if (item.isConnected) item.click();
  }
}
