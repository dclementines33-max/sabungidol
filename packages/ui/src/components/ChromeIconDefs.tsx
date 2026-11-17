// The shared chrome gradient every icon is stroked with (svg.lucide rule in tokens.css), mounted once in the app shell.
// User space = the icon's own 24×24 box, so straight lines (no height or width) still get the gradient.
export function ChromeIconDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="y2k-chrome" gradientUnits="userSpaceOnUse" x1="0" y1="2" x2="0" y2="22">
          <stop offset="0" style={{ stopColor: "var(--chrome-hi)" }} />
          <stop offset="0.45" style={{ stopColor: "var(--chrome-mid)" }} />
          <stop offset="0.55" style={{ stopColor: "var(--chrome-lo)" }} />
          <stop offset="1" style={{ stopColor: "var(--chrome-rim)" }} />
        </linearGradient>
      </defs>
    </svg>
  );
}
