import TaskCard from "./TaskCard";
import TaskRow from "./TaskRow";
import { Task } from "../types";

export default function TaskList({
  tasks,
  editingTaskNumber,
  editTitle,
  onEditTitleChange,
  onEditTitleSave,
  onEditTitleCancel,
  onStartInlineEdit,
  onStatusChange,
  onPriorityChange,
  onEdit,
  onAssign,
  onDelete,
}: {
  tasks: Task[];
  editingTaskNumber: number | null;
  editTitle: string;
  onEditTitleChange: (value: string) => void;
  onEditTitleSave: () => void;
  onEditTitleCancel: () => void;
  onStartInlineEdit: (task: Task) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onPriorityChange: (task: Task, priority: Task["priority"]) => void;
  onEdit: (task: Task) => void;
  onAssign: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  return (
    <div className="space-y-4 min-w-0">
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="w-full overflow-x-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th className="w-[46%] px-4 py-3 font-semibold">Title and Description</th>
                <th className="w-[24%] px-4 py-3 font-semibold">Assigned User and Status</th>
                <th className="w-[20%] px-4 py-3 font-semibold">Quick Updates</th>
                <th className="w-[10%] px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task._id}
                  task={task}
                  isEditing={editingTaskNumber === task.task_number}
                  editTitle={editTitle}
                  onEditTitleChange={onEditTitleChange}
                  onEditTitleSave={onEditTitleSave}
                  onEditTitleCancel={onEditTitleCancel}
                  onTitleDoubleClick={() => onStartInlineEdit(task)}
                  onStatusChange={(status) => onStatusChange(task, status)}
                  onPriorityChange={(priority) => onPriorityChange(task, priority)}
                  onEdit={() => onEdit(task)}
                  onAssign={() => onAssign(task)}
                  onDelete={() => onDelete(task)}
                />
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden sm:grid-cols-2">
        {tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onStatusChange={(status) => onStatusChange(task, status)}
            onPriorityChange={(priority) => onPriorityChange(task, priority)}
            onEdit={() => onEdit(task)}
            onAssign={() => onAssign(task)}
            onDelete={() => onDelete(task)}
          />
        ))}
      </div>
    </div>
  );
}
