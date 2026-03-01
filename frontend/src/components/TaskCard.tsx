import { useState } from "react";
import ActionMenu from "./ActionMenu";
import Dropdown from "./Dropdown";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { Task } from "../types";

export default function TaskCard({
  task,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onAssign,
  onDelete,
}: {
  task: Task;
  onStatusChange: (status: Task["status"]) => void;
  onPriorityChange: (priority: Task["priority"]) => void;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
}) {
  const descriptionLabel = task.description?.trim()
    ? task.description.trim()
    : "No description provided";
  const [expanded, setExpanded] = useState(false);
  const longDescription = descriptionLabel.length > 110;
  const assigneeLabel =
    typeof task.assignedTo === "string"
      ? task.assignedTo || "Unassigned"
      : task.assignedTo
      ? `${task.assignedTo.name} (${task.assignedTo.email})`
      : "Unassigned";

  return (
    <div className="message-enter lift-hover h-full rounded-2xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-bold text-ink">
          #{task.task_number}
        </span>
        <ActionMenu compact onEdit={onEdit} onAssign={onAssign} onDelete={onDelete} />
      </div>
      <div className="mt-3 flex items-start gap-2">
        <span
          className={`mt-1 inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${
            task.priority === "urgent"
              ? "bg-red-500"
              : task.priority === "high"
              ? "bg-orange-500"
              : task.priority === "medium"
              ? "bg-blue-500"
              : "bg-slate-400"
          }`}
        />
        <h3 className="line-clamp-1 text-base font-semibold text-ink break-words" title={task.title}>
          {task.title}
        </h3>
      </div>
      <p className={`mt-1 text-sm text-ink-muted break-words ${expanded ? "" : "line-clamp-2"}`}>
        {descriptionLabel}
      </p>
      {longDescription ? (
        <button
          type="button"
          className="mt-1 text-xs font-semibold text-primary"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
      <p className="mt-2 truncate text-sm text-ink-muted" title={assigneeLabel}>
        {assigneeLabel}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge status={task.status} />
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Dropdown value={task.status} onChange={(value) => onStatusChange(value as Task["status"])}>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Dropdown>
        <Dropdown
          value={task.priority}
          onChange={(value) => onPriorityChange(value as Task["priority"])}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Dropdown>
      </div>
    </div>
  );
}
