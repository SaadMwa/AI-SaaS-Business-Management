import { createContext, useContext, useMemo, useState } from "react";

export type AiModalAction = {
  type: "open_form";
  entityType: "task" | "sale" | "customer" | "product";
  mode: "create" | "update";
  prefill?: Record<string, unknown>;
} | null;

type AiModalContextShape = {
  open: boolean;
  action: AiModalAction;
  openModal: (nextAction: Exclude<AiModalAction, null>) => void;
  closeModal: () => void;
  resetVersion: number;
};

const AiModalContext = createContext<AiModalContextShape | null>(null);

export const AiModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<AiModalAction>(null);
  const [resetVersion, setResetVersion] = useState(0);

  const value = useMemo<AiModalContextShape>(
    () => ({
      open,
      action,
      openModal: (nextAction) => {
        setAction(nextAction);
        setOpen(true);
      },
      closeModal: () => {
        setOpen(false);
        setAction(null);
        setResetVersion((current) => current + 1);
      },
      resetVersion,
    }),
    [open, action, resetVersion]
  );

  return <AiModalContext.Provider value={value}>{children}</AiModalContext.Provider>;
};

export const useAiModal = () => {
  const context = useContext(AiModalContext);
  if (!context) {
    throw new Error("useAiModal must be used within AiModalProvider");
  }
  return context;
};

