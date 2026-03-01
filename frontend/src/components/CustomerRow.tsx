import ActionMenu from "./ActionMenu";
import NumberBadge from "./NumberBadge";
import { Customer } from "../types";

export default function CustomerRow({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="table-row-hover message-enter border-b border-border">
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <NumberBadge value={customer.customer_number} />
          <div>
            <div className="text-base font-semibold text-ink">{customer.name}</div>
            <div className="text-xs text-ink-muted">
              {customer.email || "No email"} | {customer.phone || "No phone"}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <ActionMenu
          onView={onEdit}
          onEdit={onEdit}
          onAssign={() => {}}
          onDelete={onDelete}
          showView
          showAssign={false}
        />
      </td>
    </tr>
  );
}
