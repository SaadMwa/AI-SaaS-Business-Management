import Modal from "./Modal";

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title={title} open={open} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className="btn-primary flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <span className="btn-inline-spinner" />
                Working...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
