import ActionMenu from "./ActionMenu";
import NumberBadge from "./NumberBadge";
import SaleStatusBadge from "./SaleStatusBadge";
import { Sale } from "../types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function SaleRow({
  sale,
  onEdit,
  onAssign,
  onDelete,
}: {
  sale: Sale;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
}) {
  const customerLabel =
    typeof sale.customerId === "string" ? "Customer" : sale.customerId?.name || "Unknown Customer";
  const assigneeLabel =
    typeof sale.assignedTo === "string"
      ? sale.assignedTo || "Unassigned"
      : sale.assignedTo
      ? `${sale.assignedTo.name} (${sale.assignedTo.email})`
      : "Unassigned";

  return (
    <tr className="table-row-hover message-enter border-b border-border">
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <NumberBadge value={sale.sale_number} />
          <div>
            <div className="text-base font-semibold text-ink">{customerLabel}</div>
            <div className="text-xs text-ink-muted">{assigneeLabel}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <SaleStatusBadge status={sale.status} />
          <span className="text-sm font-semibold text-ink">{formatCurrency(sale.total)}</span>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <ActionMenu onView={onEdit} onEdit={onEdit} onAssign={onAssign} onDelete={onDelete} showView />
      </td>
    </tr>
  );
}
