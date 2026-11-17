// Panel icons (the menu, page headers, trophies). Names follow the lucide ones they replace, so imports only move.
import { Cut, Eye, Hot, Ink, Line, Spark, cog, icon, star } from "./draw";

// Home: a horned roof, the door is an eye.
export const House = icon("house", <><Ink d="M5 10.5 12 4l7 6.5V20H5z" /><Line d="M2.5 11.5 12 3l9.5 8.5M5 10v10h14V10" /><Eye cx={12} cy={15.5} w={3.4} /></>);
// Dashboard: uneven tiles, one lit.
export const LayoutDashboard = icon("dashboard", <><Ink d="M3 3h8v10H3z" /><Line d="M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z" /><Spark d={star(17, 16, 3)} /></>);
// Sabung Idol: crossed blades, a clash spark where they meet.
export const Swords = icon("swords", <><Line d="M4 4l11 11M20 4 9 15M13 17l4-4M7 13l4 4M16 16l4.5 4.5M8 16l-4.5 4.5" /><Spark d={star(12, 10.5, 4)} /></>);
// Season Story: a tabloid with a bolt through the masthead.
export const Newspaper = icon("newspaper", <><Ink d="M7 7h7v3.5H7z" /><Line d="M4 4h13v16H6a2 2 0 0 1-2-2zM17 9h3v9a2 2 0 0 1-2 2M7 14h7M7 17h5" /><Spark d="M20.5 1 17 5.8h2.6L17.6 10l4.4-5.6h-2.6z" /></>);
// Idol Database: two idols, a sparkle on the front one.
export const Users = icon("users", <><Ink d="M5 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0" /><Line d="M5 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-4-6.3" /><Spark d={star(4.5, 3.5, 3)} /></>);
// Idol Profile: a trading card with its tier corner.
export const Contact = icon("contact", <><Ink d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><Line d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0M7.5 18.5a4.5 4.5 0 0 1 9 0" /><Spark tone="gold" d="M14 2h4a2 2 0 0 1 2 2v4z" /></>);
// Girl Group Stats: a line-up, the centre stands tall.
export const UsersRound = icon("group", <><Ink d="M9 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0" /><Line d="M9 7a3 3 0 1 0 6 0 3 3 0 1 0-6 0M3.5 10.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M15.5 10.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M6 21a6 6 0 0 1 12 0M1.5 19.5a4.5 4.5 0 0 1 5-4.4M22.5 19.5a4.5 4.5 0 0 0-5-4.4" /><Spark d={star(12, 1.8, 2.2)} /></>);
// Career Stats: a skyline of bars, a star over the tallest.
export const ChartColumn = icon("chart", <><Ink d="M12 8h3v9h-3z" /><Line d="M3 3v18h18M7 12h3v5H7zM12 8h3v9h-3zM17 11h3v6h-3z" /><Spark d={star(13.5, 4, 2.8)} /></>);
// Head to Head: two arrows meet, red corner and blue corner.
export const GitCompareArrows = icon("h2h", <><Line d="M3 8h12M11 4l4 4-4 4M21 16H9M13 12l-4 4 4 4" /><Spark d="M2.5 16a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0" /><Spark tone="cool" d="M16.5 8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0" /></>);
// Hall of Champions: a horned crown with a gold gem.
export const Crown = icon("crown", <><Ink d="M3 8l4 4 5-7 5 7 4-4-2 11H5z" /><Line d="M3 8l4 4 5-7 5 7 4-4-2 11H5zM5 22h14" /><Spark tone="gold" d="M12 11.5l2 2.5-2 2.5-2-2.5z" /></>);
// All-time Records: a medal on its ribbon, a gold star struck in.
export const Medal = icon("medal", <><Ink d="M6 15a6 6 0 1 0 12 0 6 6 0 1 0-12 0" /><Line d="M7 2l3 7.5M17 2l-3 7.5M6 15a6 6 0 1 0 12 0 6 6 0 1 0-12 0" /><Spark tone="gold" d={star(12, 15, 3.4)} /></>);
// Match Database: the all-seeing cylinder.
export const Database = icon("database", <><Ink d="M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z" /><Line d="M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /><Eye cx={12} cy={18.3} w={2.6} /></>);
// Season Progression: a climbing line over its own shadow.
export const TrendingUp = icon("trend", <><Ink d="M2 18l6-6 4 4 9-9v14H2z" /><Line d="M2 18l6-6 4 4 9-9M15 7h6v6" /><Spark d="M6.4 12a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 1 0-3.2 0" /></>);
// Season Archive: a box with a star sealed inside.
export const Archive = icon("archive", <><Ink d="M3 3h18v5H3z" /><Line d="M3 3h18v5H3zM4.5 8v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8M10 12h4" /><Spark d={star(12, 16.5, 3)} /></>);
// Input Data: a sheet with its corner folded, a red plus.
export const FilePlus2 = icon("file-plus", <><Ink d="M14 2v6h6z" /><Line d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" /><Hot d="M12 11.5v7M8.5 15h7" /></>);
// Rating Manager: a speedo, the needle in the red.
export const Gauge = icon("gauge", <><Ink d="M3.5 17a9 9 0 1 1 17 0z" /><Line d="M3.5 17a9 9 0 1 1 17 0M6 9.5l1 1M12 5.5V7M18 9.5l-1 1M3 20h18" /><Hot d="M12 14l4.5-5.5" /><Spark d="M10.2 14a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 1 0-3.6 0" /></>);
// Inactive Manager: an idol crossed out.
export const UserRoundX = icon("user-out", <><Ink d="M6 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0" /><Line d="M6 8a4 4 0 1 0 8 0 4 4 0 1 0-8 0M3 21a7 7 0 0 1 12.5-4.3" /><Hot d="M17 15l5 5M22 15l-5 5" /></>);
// Settings: a cog that stares back.
export const Settings = icon("settings", <><Ink d={cog(8, 10, 7.4)} /><Line d={cog(8, 10, 7.4)} /><Eye cx={12} cy={12} w={4} /></>);
// Competitions: the cup, a gold star on its bowl.
export const Trophy = icon("trophy", <><Ink d="M7 3h10v6a5 5 0 0 1-10 0z" /><Line d="M7 3h10v6a5 5 0 0 1-10 0zM7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5M12 14v3M9 17h6v4H9zM7 21h10" /><Spark tone="gold" d={star(12, 8, 3)} /></>);
// Ranking (new panel): the podium, a gold star over first place.
export const Ranks = icon("ranks", <><Ink d="M8 9h8v12H8z" /><Line d="M2 21v-7h6M8 21V9h8v12M16 13h6v8M1 21h22" /><Spark tone="gold" d={star(12, 4.2, 3.2)} /><Cut cx={12} cy={4.2} r={0.6} /></>);
// Tier List (new panel): three rows, the top label gold.
export const Tiers = icon("tiers", <><Ink d="M3 10h4v4H3z" /><Line d="M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3zM7 4v16" /><Spark tone="gold" d="M3 4h4v4H3z" /><Hot d="M10 6h5M10 12h7M10 18h3" /></>);
