import { useEffect, useMemo, useState } from "react";
import AssignModal from "../components/AssignModal";
import TaskList from "../components/TaskList";
import TaskModal from "../components/TaskModal";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import Dropdown from "../components/Dropdown";
import { useToast } from "../hooks/useToast";
import { getErrorMessage } from "../services/api";
import { taskService } from "../services/task.service";
import { AssignableUser, userService } from "../services/user.service";
import { Task } from "../types";

const normalizeStatus = (status: Task["status"]) =>
  status === "in-progress" ? "in_progress" : status;

const normalizeTask = (task: Task) => ({
  ...task,
  status: normalizeStatus(task.status),
});

const priorityRank: Record<Task["priority"], number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigningTask, setAssigningTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null);
  const [inlineEditingTaskNumber, setInlineEditingTaskNumber] = useState<number | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("task_number");
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "todo" as Task["status"],
    dueDate: "",
    assignedTo: "",
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    status: "todo" as Task["status"],
    dueDate: "",
    assignedTo: "",
  });
  const [assignUserId, setAssignUserId] = useState("");
  const { toast, showToast, hideToast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [data, userList] = await Promise.all([taskService.list(), userService.list()]);
      setTasks(data.map(normalizeTask));
      setUsers(userList);
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handler = () => {
      void load();
    };
    window.addEventListener("tasks:refresh", handler);
    return () => window.removeEventListener("tasks:refresh", handler);
  }, []);

  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = [...tasks];

    if (term) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.task_number.toString().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        result = result.filter((task) => !task.assignedTo);
      } else {
        result = result.filter((task) =>
          typeof task.assignedTo === "string"
            ? task.assignedTo === assigneeFilter
            : task.assignedTo?._id === assigneeFilter
        );
      }
    }

    result.sort((a, b) => {
      if (sortBy === "task_number") return a.task_number - b.task_number;
      if (sortBy === "priority") return priorityRank[b.priority] - priorityRank[a.priority];
      if (sortBy === "dueDate") {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      }
      return 0;
    });

    return result;
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, sortBy]);

  const handleCreate = async () => {
    if (!createForm.title.trim()) {
      showToast("Task title is required", "error");
      return;
    }

    setSaving(true);
    try {
      const created = await taskService.create({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        priority: createForm.priority,
        status: createForm.status,
        dueDate: createForm.dueDate || undefined,
        assignedTo: createForm.assignedTo || undefined,
        raw_input: createForm.title.trim(),
      });
      setTasks((prev) => [...prev, normalizeTask(created)]);
      setOpenCreate(false);
      setCreateForm({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        dueDate: "",
        assignedTo: "",
      });
      showToast("Task created", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInlineEditStart = (task: Task) => {
    setInlineEditingTaskNumber(task.task_number);
    setInlineTitle(task.title);
  };

  const handleInlineEditSave = async () => {
    if (!inlineEditingTaskNumber) return;
    if (!inlineTitle.trim()) {
      showToast("Task title is required", "error");
      return;
    }
    setSaving(true);
    try {
      const updated = await taskService.updateByNumber(inlineEditingTaskNumber, {
        title: inlineTitle.trim(),
      });
      setTasks((prev) =>
        prev.map((task) =>
          task.task_number === inlineEditingTaskNumber ? normalizeTask(updated) : task
        )
      );
      setInlineEditingTaskNumber(null);
      setInlineTitle("");
      showToast("Task title updated", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleInlineEditCancel = () => {
    setInlineEditingTaskNumber(null);
    setInlineTitle("");
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    if (task.status === status) return;
    try {
      const updated = await taskService.updateStatusByNumber(task.task_number, status);
      setTasks((prev) =>
        prev.map((item) =>
          item.task_number === task.task_number ? normalizeTask(updated) : item
        )
      );
      showToast("Status updated", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const handlePriorityChange = async (task: Task, priority: Task["priority"]) => {
    if (task.priority === priority) return;
    try {
      const updated = await taskService.updatePriorityByNumber(task.task_number, priority);
      setTasks((prev) =>
        prev.map((item) =>
          item.task_number === task.task_number ? normalizeTask(updated) : item
        )
      );
      showToast("Priority updated", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  };

  const handleEditOpen = (task: Task) => {
    setInlineEditingTaskNumber(null);
    setEditingTask(task);
    setEditForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      status: normalizeStatus(task.status || "todo"),
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      assignedTo:
        typeof task.assignedTo === "string"
          ? task.assignedTo
          : task.assignedTo?._id || "",
    });
  };

  const handleEditSave = async () => {
    if (!editingTask) return;
    if (!editForm.title.trim()) {
      showToast("Task title is required", "error");
      return;
    }

    setSaving(true);
    try {
      const updated = await taskService.updateByNumber(editingTask.task_number, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        status: editForm.status,
        dueDate: editForm.dueDate || undefined,
        assignedTo: editForm.assignedTo || undefined,
      });
      setTasks((prev) =>
        prev.map((task) =>
          task.task_number === editingTask.task_number ? normalizeTask(updated) : task
        )
      );
      setEditingTask(null);
      showToast("Task updated", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignOpen = (task: Task) => {
    setAssigningTask(task);
    setAssignUserId(
      typeof task.assignedTo === "string" ? task.assignedTo : task.assignedTo?._id || ""
    );
  };

  const handleAssignSave = async () => {
    if (!assigningTask) return;
    const taskNumber = assigningTask.task_number;
    const previous = tasks;
    const nextAssignedTo = assignUserId
      ? users.find((user) => user._id === assignUserId) || assignUserId
      : undefined;

    setTasks((prev) =>
      prev.map((task) =>
        task.task_number === taskNumber
          ? normalizeTask({
              ...task,
              assignedTo: nextAssignedTo as any,
            })
          : task
      )
    );

    setSaving(true);
    try {
      const updated = assignUserId
        ? await taskService.assignByNumber(taskNumber, {
            assignedTo: assignUserId,
          })
        : await taskService.unassignByNumber(taskNumber);
      setTasks((prev) =>
        prev.map((task) =>
          task.task_number === taskNumber ? normalizeTask(updated) : task
        )
      );
      setAssigningTask(null);
      setAssignUserId("");
      showToast(assignUserId ? "Task assigned" : "Task unassigned", "success");
    } catch (error) {
      setTasks(previous);
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = (task: Task) => {
    setConfirmDelete(task);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      await taskService.removeByNumber(confirmDelete.task_number);
      setTasks((prev) => prev.filter((task) => task.task_number !== confirmDelete.task_number));
      setConfirmDelete(null);
      showToast("Task deleted", "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Tasks</h2>
          <p className="text-sm text-ink-muted">
            Track, assign, and prioritize tasks with agent-grade precision.
          </p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setOpenCreate(true)}>
          New Task
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card lg:grid-cols-5 min-w-0">
        <input
          className="min-w-0 rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Search by # or title"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Dropdown value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </Dropdown>
        <Dropdown value={priorityFilter} onChange={setPriorityFilter}>
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Dropdown>
        <Dropdown value={assigneeFilter} onChange={setAssigneeFilter}>
          <option value="all">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </Dropdown>
        <Dropdown value={sortBy} onChange={setSortBy}>
          <option value="task_number">Sort by Task #</option>
          <option value="priority">Sort by Priority</option>
          <option value="dueDate">Sort by Due Date</option>
        </Dropdown>
      </div>

      {loading ? <div className="text-sm text-ink-muted">Loading tasks...</div> : null}

      {filteredTasks.length ? (
        <TaskList
          tasks={filteredTasks}
          editingTaskNumber={inlineEditingTaskNumber}
          editTitle={inlineTitle}
          onEditTitleChange={setInlineTitle}
          onEditTitleSave={handleInlineEditSave}
          onEditTitleCancel={handleInlineEditCancel}
          onStartInlineEdit={handleInlineEditStart}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onEdit={handleEditOpen}
          onAssign={handleAssignOpen}
          onDelete={handleDeleteConfirm}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center text-sm text-ink-muted">
          No tasks match these filters yet.
        </div>
      )}

      <TaskModal
        open={openCreate}
        mode="create"
        form={createForm}
        users={users}
        saving={saving}
        onClose={() => setOpenCreate(false)}
        onChange={setCreateForm}
        onSave={handleCreate}
      />

      <TaskModal
        open={Boolean(editingTask)}
        mode="edit"
        form={editForm}
        users={users}
        saving={saving}
        onClose={() => setEditingTask(null)}
        onChange={setEditForm}
        onSave={handleEditSave}
      />

      <AssignModal
        open={Boolean(assigningTask)}
        users={users}
        selectedUserId={assignUserId}
        saving={saving}
        onChange={setAssignUserId}
        onClose={() => setAssigningTask(null)}
        onAssign={handleAssignSave}
      />

      <Modal title="Confirm Delete" open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Confirm: Do you want to delete task #{confirmDelete?.task_number}?
          </p>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {toast ? <Toast message={toast.message} type={toast.type} onClose={hideToast} /> : null}
    </div>
  );
}
