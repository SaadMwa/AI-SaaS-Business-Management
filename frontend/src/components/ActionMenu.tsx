import { useState } from "react";

export default function ActionMenu({
  onView,
  onEdit,
  onAssign,
  onDelete,
  showView = false,
  showAssign = true,
  compact = false,
}: {
  onView?: () => void;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
  showView?: boolean;
  showAssign?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (!compact) {
    return (
      <div className="flex items-center gap-2">
        {showView ? (
          <button className="text-sm font-semibold text-ink-muted" type="button" onClick={onView}>
            View
          </button>
        ) : null}
        <button className="text-sm font-semibold text-primary" type="button" onClick={onEdit}>
          Edit
        </button>
        {showAssign ? (
          <button className="text-sm font-semibold text-ink-muted" type="button" onClick={onAssign}>
            Assign
          </button>
        ) : null}
        <button className="text-sm font-semibold text-danger-text" type="button" onClick={onDelete}>
          Delete
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="rounded-lg border border-border px-2 py-1 text-sm text-ink-muted"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        Actions
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl border border-border bg-card shadow-card">
          {showView ? (
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
              type="button"
              onClick={() => {
                setOpen(false);
                onView?.();
              }}
            >
              View
            </button>
          ) : null}
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </button>
          {showAssign ? (
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
              type="button"
              onClick={() => {
                setOpen(false);
                onAssign();
              }}
            >
              Assign
            </button>
          ) : null}
          <button
            className="w-full px-3 py-2 text-left text-sm text-danger-text hover:bg-surface-muted"
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
