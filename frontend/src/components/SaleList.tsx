import SaleRow from "./SaleRow";
import NumberBadge from "./NumberBadge";
import SaleStatusBadge from "./SaleStatusBadge";
import { Sale } from "../types";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function SaleList({
  sales,
  onEdit,
  onAssign,
  onDelete,
}: {
  sales: Sale[];
  onEdit: (sale: Sale) => void;
  onAssign: (sale: Sale) => void;
  onDelete: (sale: Sale) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Sale</th>
                <th className="px-4 py-3 font-semibold">Status & Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <SaleRow
                  key={sale._id}
                  sale={sale}
                  onEdit={() => onEdit(sale)}
                  onAssign={() => onAssign(sale)}
                  onDelete={() => onDelete(sale)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {sales.map((sale) => (
          <div key={sale._id} className="message-enter lift-hover rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <NumberBadge value={sale.sale_number} />
              <SaleStatusBadge status={sale.status} />
            </div>
            <div className="mt-3 text-base font-semibold text-ink">
              {typeof sale.customerId === "string"
                ? "Customer"
                : sale.customerId?.name || "Unknown Customer"}
            </div>
            <div className="text-sm text-ink-muted">{formatCurrency(sale.total)}</div>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost" onClick={() => onEdit(sale)}>
                Edit
              </button>
              <button className="btn-ghost" onClick={() => onAssign(sale)}>
                Assign
              </button>
              <button className="btn-ghost" onClick={() => onDelete(sale)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
