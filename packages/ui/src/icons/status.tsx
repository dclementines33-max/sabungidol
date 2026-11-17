// Status icons (notices, form, awards, people out).
import { Hot, Ink, Line, Spark, icon, star } from "./draw";

const RING = "M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0";
export const TriangleAlert = icon("alert", <><Ink d="M12 3 2 20h20z" /><Line d="M12 3 2 20h20zM12 9v5M12 17h.01" /></>);
export const Info = icon("info", <><Ink d={RING} /><Line d={`${RING}M12 11v6M12 7.5h.01`} /></>);
export const CircleX = icon("circle-x", <><Ink d={RING} /><Line d={`${RING}M9 9l6 6M15 9l-6 6`} /></>);
export const CircleCheck = icon("circle-check", <><Ink d={RING} /><Line d={`${RING}M8 12l3 3 5-6`} /></>);
export const Ban = icon("ban", <><Ink d={RING} /><Line d={`${RING}M5.6 5.6l12.8 12.8`} /></>);
// Notifications: the bell with its red dot.
export const Bell = icon("bell", <><Ink d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><Line d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" /><Spark d="M16.5 4a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0" /></>);
// Hot form: a flame with a gold core.
export const Flame = icon("flame", <><Ink d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2.5 3 4.5C12.8 8 12 5 12 2z" /><Line d="M12 2c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 2.5 3 4.5C12.8 8 12 5 12 2z" /><Spark tone="gold" d="M12 13c1.5 1.2 2.5 2.4 2.5 4a2.5 2.5 0 0 1-5 0c0-1.6 1-2.8 2.5-4z" /></>);
// Cold form: six arms, an ice core.
export const Snowflake = icon("snow", <><Line d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9 3.5l3 2 3-2M9 20.5l3-2 3 2M3 10.5l3.3-.6-1-3.2M21 13.5l-3.3.6 1 3.2" /><Spark tone="cool" d={star(12, 12, 3)} /></>);
// Awards: a rosette, a gold star in the middle.
export const Award = icon("award", <><Ink d="M6 9a6 6 0 1 0 12 0 6 6 0 1 0-12 0" /><Line d="M6 9a6 6 0 1 0 12 0 6 6 0 1 0-12 0M8.2 13.6 7 22l5-3 5 3-1.2-8.4" /><Spark tone="gold" d={star(12, 9, 3.4)} /></>);
export const UserX = icon("user-x", <><Ink d="M5 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0" /><Line d="M5 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M2 21a7 7 0 0 1 14 0" /><Hot d="M17 8l5 5M22 8l-5 5" /></>);
