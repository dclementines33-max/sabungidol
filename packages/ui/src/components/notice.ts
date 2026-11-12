// A notification (PRD §14.1) and how each level looks. Stored in event_log and the NotificationCenter.
import { Ban, CircleCheck, CircleX, Info, TriangleAlert } from "lucide-react";

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

export const LEVEL = {
  info: { label: "Info", color: "text-accent-sky", icon: Info },
  success: { label: "Success", color: "text-accent-sage", icon: CircleCheck },
  warning: { label: "Warning", color: "text-accent-gold", icon: TriangleAlert },
  blocker: { label: "Blocker", color: "text-accent-coral", icon: Ban },
  error: { label: "Error", color: "text-danger", icon: CircleX },
} as const;
