import Badge from "./Badge";
import { Task } from "../types";

const priorityMap: Record<Task["priority"], { label: string; tone: "info" | "success" | "warning" | "danger" }> = {
  low: { label: "Low", tone: "info" },
  medium: { label: "Medium", tone: "warning" },
  high: { label: "High", tone: "danger" },
  urgent: { label: "Urgent", tone: "danger" },
};

export default function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const config = priorityMap[priority] || priorityMap.medium;
  return <Badge label={config.label} tone={config.tone} />;
}
