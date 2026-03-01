import { useCallback, useState } from "react";

export type ToastState = {
  message: string;
  type: "info" | "success" | "error";
} | null;

export const useToast = () => {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((message: string, type: "info" | "success" | "error") => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  return { toast, showToast, hideToast };
};
