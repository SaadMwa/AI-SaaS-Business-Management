import { useState } from "react";
import ActionMenu from "./ActionMenu";
import Dropdown from "./Dropdown";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { Task } from "../types";

export default function TaskRow({
  task,
  isEditing,
  editTitle,
  onEditTitleChange,
  onEditTitleSave,
  onEditTitleCancel,
  onTitleDoubleClick,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onAssign,
  onDelete,
}: {
  task: Task;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (value: string) => void;
  onEditTitleSave: () => void;
  onEditTitleCancel: () => void;
  onTitleDoubleClick: () => void;
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
  const longDescription = descriptionLabel.length > 140;
  const assigneeLabel =
    typeof task.assignedTo === "string"
      ? task.assignedTo || "Unassigned"
      : task.assignedTo
      ? `${task.assignedTo.name} (${task.assignedTo.email})`
      : "Unassigned";

  return (
    <tr className="table-row-hover message-enter border-b border-border">
      <td className="px-4 py-4 align-top">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-surface-muted px-2 py-1 text-xs font-bold text-ink">
            #{task.task_number}
          </span>
          <div className="min-w-0 max-w-full">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  className="w-full rounded-lg border border-border px-3 py-1 text-sm"
                  value={editTitle}
                  onChange={(event) => onEditTitleChange(event.target.value)}
                />
                <button
                  className="text-sm font-semibold text-primary"
                  type="button"
                  onClick={onEditTitleSave}
                >
                  Save
                </button>
                <button
                  className="text-sm text-ink-muted"
                  type="button"
                  onClick={onEditTitleCancel}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div
                className="max-w-[24rem] truncate text-base font-semibold text-ink cursor-text"
                title={task.title}
                onDoubleClick={onTitleDoubleClick}
              >
                {task.title}
              </div>
            )}
            <div className={`max-w-[28rem] text-sm text-ink-muted break-words ${expanded ? "" : "line-clamp-2"}`}>
              {descriptionLabel}
            </div>
            {longDescription ? (
              <button
                type="button"
                className="mt-0.5 text-xs font-semibold text-primary"
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            ) : null}
            <div className="max-w-[20rem] truncate text-xs text-ink-muted" title={assigneeLabel}>
              {assigneeLabel}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-wrap items-center gap-2 max-w-[20rem]">
          <span className="max-w-[14rem] truncate text-xs text-ink-muted" title={assigneeLabel}>
            {assigneeLabel}
          </span>
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
        </div>
      </td>
      <td className="px-4 py-4 align-top">
        <div className="flex flex-col gap-2">
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
      </td>
      <td className="px-4 py-4 align-top text-right">
        <ActionMenu onEdit={onEdit} onAssign={onAssign} onDelete={onDelete} />
      </td>
    </tr>
  );
}
