import CustomerRow from "./CustomerRow";
import NumberBadge from "./NumberBadge";
import { Customer } from "../types";

export default function CustomerList({
  customers,
  onEdit,
  onDelete,
}: {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <CustomerRow
                  key={customer._id}
                  customer={customer}
                  onEdit={() => onEdit(customer)}
                  onDelete={() => onDelete(customer)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {customers.map((customer) => (
          <div key={customer._id} className="message-enter lift-hover rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <NumberBadge value={customer.customer_number} />
            </div>
            <div className="mt-3 text-lg font-semibold text-ink">{customer.name}</div>
            <div className="text-sm text-ink-muted">{customer.email || "No email"}</div>
            <div className="text-sm text-ink-muted">{customer.phone || "No phone"}</div>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost" onClick={() => onEdit(customer)}>
                Edit
              </button>
              <button className="btn-ghost" onClick={() => onDelete(customer)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
