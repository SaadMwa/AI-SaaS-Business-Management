import Badge from "./Badge";
import { Task } from "../types";

const normalizeStatus = (status: Task["status"]) => (status === "in-progress" ? "in_progress" : status);

const statusMap: Record<string, { label: string; tone: "info" | "success" | "warning" | "danger" }> = {
  todo: { label: "To Do", tone: "info" },
  in_progress: { label: "In Progress", tone: "warning" },
  blocked: { label: "Blocked", tone: "danger" },
  done: { label: "Done", tone: "success" },
};

export default function StatusBadge({ status }: { status: Task["status"] }) {
  const normalized = normalizeStatus(status);
  const config = statusMap[normalized] || statusMap.todo;
  return <Badge label={config.label} tone={config.tone} />;
}
