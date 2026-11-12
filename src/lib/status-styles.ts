import type { CellState } from "@/lib/constants";

export type StatusStyle = {
  background: string;
  text: string;
  border: string;
  icon: "Check" | "X" | "AlertCircle" | "PauseCircle" | null;
  labelKey: string;
};

export const STATUS_STYLES: Record<CellState, StatusStyle> = {
  delivered: {
    background: "bg-green-100",
    text: "text-green-700",
    border: "border-green-700",
    icon: "Check",
    labelKey: "status.delivered",
  },
  not_delivered: {
    background: "bg-red-100",
    text: "text-red-700",
    border: "border-red-700",
    icon: "X",
    labelKey: "status.notDelivered",
  },
  unmarked: {
    background: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-700",
    icon: "AlertCircle",
    labelKey: "status.unmarked",
  },
  paused: {
    background: "bg-slate-100",
    text: "text-slate-500",
    border: "border-slate-500",
    icon: "PauseCircle",
    labelKey: "status.paused",
  },
  future: {
    background: "bg-transparent",
    text: "text-slate-400",
    border: "border-dashed border-slate-400",
    icon: null,
    labelKey: "status.future",
  },
  not_scheduled: {
    background: "bg-transparent",
    text: "text-slate-300",
    border: "border-transparent",
    icon: null,
    labelKey: "status.notScheduled",
  },
};
