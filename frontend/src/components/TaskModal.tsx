import Modal from "./Modal";
import Dropdown from "./Dropdown";
import { AssignableUser } from "../services/user.service";
import { Task } from "../types";

type TaskFormState = {
  title: string;
  description: string;
  priority: Task["priority"];
  status: Task["status"];
  dueDate: string;
  assignedTo: string;
};

export default function TaskModal({
  open,
  mode,
  form,
  users,
  saving,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  form: TaskFormState;
  users: AssignableUser[];
  saving: boolean;
  onClose: () => void;
  onChange: (next: TaskFormState) => void;
  onSave: () => void;
}) {
  return (
    <Modal title={mode === "create" ? "Create Task" : "Edit Task"} open={open} onClose={onClose}>
      <div className="space-y-4">
        <input
          className="w-full rounded-lg border border-border px-4 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
        />
        <textarea
          className="w-full rounded-lg border border-border px-4 py-2"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Dropdown
            value={form.priority}
            onChange={(value) => onChange({ ...form, priority: value as Task["priority"] })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Dropdown>
          <Dropdown
            value={form.status}
            onChange={(value) => onChange({ ...form, status: value as Task["status"] })}
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </Dropdown>
        </div>
        <input
          className="w-full rounded-lg border border-border px-4 py-2"
          type="date"
          value={form.dueDate}
          onChange={(event) => onChange({ ...form, dueDate: event.target.value })}
        />
        <Dropdown
          value={form.assignedTo}
          onChange={(value) => onChange({ ...form, assignedTo: value })}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Dropdown>
        <button className="btn-primary w-full" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
