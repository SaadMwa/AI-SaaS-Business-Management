import { ReactNode, useEffect, useRef, useState } from "react";

export default function Modal({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);
  const idRef = useRef(`modal-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onActivate = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      const nextId = detail?.id;
      if (nextId && nextId !== idRef.current) {
        onClose();
      }
    };

    window.addEventListener("app:modal-activate", onActivate as EventListener);
    window.dispatchEvent(
      new CustomEvent("app:modal-activate", { detail: { id: idRef.current } })
    );

    return () => {
      window.removeEventListener("app:modal-activate", onActivate as EventListener);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!rendered) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div
      className={`modal-backdrop fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "bg-slate-950/45 opacity-100" : "bg-slate-950/0 opacity-0"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`card w-full max-h-[90vh] max-w-xl overflow-y-auto p-6 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
