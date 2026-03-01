import { useEffect } from "react";

export default function Toast({
  message,
  type = "info",
  onClose,
}: {
  message: string;
  type?: "info" | "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    info: "bg-info-bg text-info-text border border-info-border",
    success: "bg-success-bg text-success-text border border-success-border",
    error: "bg-danger-bg text-danger-text border border-danger-border",
  };

  return (
    <div
      className={`message-enter fixed bottom-6 right-6 z-[80] flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-card ${colors[type]}`}
    >
      {type === "success" ? (
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-text/20 text-[10px] font-bold">
          OK
        </span>
      ) : null}
      <span className="break-words">{message}</span>
    </div>
  );
}
