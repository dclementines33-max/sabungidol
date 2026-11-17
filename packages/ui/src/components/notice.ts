// A notification (PRD §14.1) and how each level looks. Stored in event_log and the NotificationCenter.
import { Ban, CircleCheck, CircleX, Info, TriangleAlert } from "../icons";

export type NoticeLevel = "info" | "success" | "warning" | "blocker" | "error";

export type Notice = {
  id: string;
  level: NoticeLevel;
  message: string;
  code?: string; // e.g. "E-DRAW-002"
  context?: string;
  at: string; // ISO time
  undo?: () => void;
};

// icon-tone: alarm levels keep their colour instead of the chrome icon stroke (tokens.css).
export const LEVEL = {
  info: { label: "Info", color: "text-cool", icon: Info },
  success: { label: "Success", color: "text-cool", icon: CircleCheck },
  warning: { label: "Warning", color: "icon-tone text-accent-bright", icon: TriangleAlert },
  blocker: { label: "Blocker", color: "icon-tone text-accent-bright", icon: Ban },
  error: { label: "Error", color: "icon-tone text-danger", icon: CircleX },
} as const;
