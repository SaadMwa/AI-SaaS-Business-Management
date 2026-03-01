import Badge from "./Badge";
import { Sale } from "../types";

const statusMap: Record<Sale["status"], { label: string; tone: "info" | "success" | "warning" | "danger" }> = {
  draft: { label: "Draft", tone: "info" },
  pending: { label: "Pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  refunded: { label: "Refunded", tone: "danger" },
};

export default function SaleStatusBadge({ status }: { status: Sale["status"] }) {
  const config = statusMap[status] || statusMap.pending;
  return <Badge label={config.label} tone={config.tone} />;
}
