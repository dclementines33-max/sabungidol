// Control icons (buttons, arrows, media, files). Kept quieter than the panel icons: outline + ink, rarely a spark.
import { Eye, Hot, Ink, Line, Spark, icon, star } from "./draw";

export const X = icon("x", <Line d="M18 5.5 6 18.5M6 5.5l12 13" />);
export const Plus = icon("plus", <Line d="M12 4v16M4 12h16" />);
export const Minus = icon("minus", <Line d="M4 12h16" />);
export const ChevronRight = icon("chevron-right", <Line d="M9 5l7 7-7 7" />);
export const ChevronLeft = icon("chevron-left", <Line d="M15 5l-7 7 7 7" />);
export const ArrowRight = icon("arrow-right", <Line d="M4 12h15M13 6l6 6-6 6" />);
export const ArrowUp = icon("arrow-up", <Line d="M12 20V5M6 11l6-6 6 6" />);
export const ArrowDown = icon("arrow-down", <Line d="M12 4v15M6 13l6 6 6-6" />);
export const Download = icon("download", <><Line d="M12 3v12M7 10l5 5 5-5" /><Hot d="M4 20.5h16" /></>);
// Search: the lens is an eye.
export const Search = icon("search", <><Ink d="M4 11a7 7 0 1 0 14 0 7 7 0 1 0-14 0" /><Line d="M4 11a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-4.6-4.6" /><Eye cx={11} cy={11} w={3.6} /></>);
export const SearchX = icon("search-x", <><Ink d="M4 11a7 7 0 1 0 14 0 7 7 0 1 0-14 0" /><Line d="M4 11a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-4.6-4.6" /><Hot d="M8.5 8.5l5 5M13.5 8.5l-5 5" /></>);
export const Play = icon("play", <><Ink d="M6 4l14 8-14 8z" /><Line d="M6 4l14 8-14 8z" /></>);
export const Pause = icon("pause", <><Ink d="M6 4h4v16H6zM14 4h4v16h-4z" /><Line d="M6 4h4v16H6zM14 4h4v16h-4z" /></>);
export const SkipForward = icon("skip", <><Ink d="M4 4l11 8-11 8z" /><Line d="M4 4l11 8-11 8zM19 5v14" /></>);
const FRAME = "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z";
export const PanelLeft = icon("panel", <><Ink d="M3 3h6v18H3z" /><Line d={`${FRAME}M9 3v18`} /></>);
export const PanelLeftOpen = icon("panel-open", <><Ink d="M3 3h6v18H3z" /><Line d={`${FRAME}M9 3v18`} /><Hot d="M13 9l3 3-3 3" /></>);
export const PanelLeftClose = icon("panel-close", <><Ink d="M3 3h6v18H3z" /><Line d={`${FRAME}M9 3v18`} /><Hot d="M16 9l-3 3 3 3" /></>);
export const Table = icon("table", <><Ink d="M3 3h18v6H3z" /><Line d={`${FRAME}M3 9h18M3 15h18M12 3v18`} /></>);
export const LayoutGrid = icon("grid", <><Ink d="M3 3h7v7H3z" /><Line d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" /></>);
// Image: the sun over the hills is a spark.
export const Image = icon("image", <><Ink d="M3 17l5-5 4 4 3-3 6 6v1H3z" /><Line d={`${FRAME}M3 17l5-5 4 4 3-3 6 6`} /><Spark d="M6.5 8.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0" /></>);
export const ImagePlus = icon("image-plus", <><Ink d="M3 17l5-5 4 4 3-3 6 6v1H3z" /><Line d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8M3 17l5-5 4 4 3-3 6 6" /><Hot d="M19 2v6M16 5h6" /></>);
export const FolderOpen = icon("folder", <><Ink d="M2 19l3-8h17l-3 8z" /><Line d="M2 19V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v3M2 19l3-8h17l-3 8z" /></>);
export const CheckCheck = icon("check-check", <><Line d="M18 6 7 17l-5-5" /><Hot d="M22 10l-7.5 7.5L13 16" /></>);
export const BookOpen = icon("book", <><Ink d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" /><Line d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" /></>);
export const DatabaseBackup = icon("backup", <><Ink d="M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" /><Line d="M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 5v14c0 1.7 3.6 3 8 3M20 5v5M4 12c0 1.7 3.6 3 8 3" /><Hot d="M14.5 18.5a3.5 3.5 0 1 0 1-2.5M14.5 13.5v2.5H17" /></>);
export const Wrench = icon("wrench", <Line d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />);
export const Pencil = icon("pencil", <><Ink d="M16 3l5 5L9 20H4v-5z" /><Line d="M16 3l5 5L9 20H4v-5zM13.5 5.5l5 5" /></>);
export const Trash = icon("trash", <><Ink d="M5 6h14l-1.2 15H6.2z" /><Line d="M3 6h18M8 6V3.5h8V6M5 6l1.2 15h11.6L19 6M10 10.5v6M14 10.5v6" /></>);
export const RotateCcw = icon("rotate", <><Line d="M3 12a9 9 0 1 0 3-6.7L3 8" /><Hot d="M3 3v5h5" /></>);
export const Shuffle = icon("shuffle", <><Line d="M2 18h3.5c3 0 4.5-2 6-6s3-6 6-6H22M2 6h3.5c1.8 0 3 .8 4 2M22 18h-4.5c-1.8 0-3-.8-4-2" /><Hot d="M19 3l3 3-3 3M19 15l3 3-3 3" /></>);
// A drag handle: six dots.
export const Grip = icon("grip", <><Line d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" /></>);
// Save / done: a stamp with a star.
export const Sparkles = icon("sparkles", <><Spark d={star(10, 12, 7)} /><Spark tone="gold" d={star(19, 5, 3)} /><Line d={star(10, 12, 7)} /></>);
