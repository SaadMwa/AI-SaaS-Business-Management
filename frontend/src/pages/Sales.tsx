import { useEffect, useMemo, useState } from "react";
import AssignModal from "../components/AssignModal";
import Dropdown from "../components/Dropdown";
import Modal from "../components/Modal";
import SaleList from "../components/SaleList";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { customerService } from "../services/customer.service";
import { saleService } from "../services/sale.service";
import { AssignableUser, userService } from "../services/user.service";
import { Customer, SaleItem, Sale } from "../types";
import { logger } from "../utils/logger";

type SaleForm = {
  customerId: string;
  items: SaleItem[];
  status: Sale["status"];
  paymentMethod: Sale["paymentMethod"];
  date: string;
};

const createEmptyItem = (): SaleItem => ({ name: "", quantity: 1, price: 0 });

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

const isValidDate = (value: string) => !value || !Number.isNaN(new Date(value).getTime());

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [assigning, setAssigning] = useState<Sale | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Sale | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const { toast, showToast, hideToast } = useToast();

  const [form, setForm] = useState<SaleForm>({
    customerId: "",
    items: [createEmptyItem()],
    status: "pending",
    paymentMethod: "card",
    date: "",
  });

  const safeSales = useMemo(() => (Array.isArray(sales) ? sales.filter(Boolean) : []), [sales]);
  const safeCustomers = useMemo(
    () => (Array.isArray(customers) ? customers.filter(Boolean) : []),
    [customers]
  );

  const total = useMemo(
    () => form.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [form.items]
  );

  const load = async () => {
    try {
      setLoading(true);
      const [saleData, customerData, userList] = await Promise.all([
        saleService.list(),
        customerService.list(),
        userService.list(),
      ]);
      setSales(saleData);
      setCustomers(customerData);
      setUsers(userList);
    } catch (error) {
      logger.error("sales_load_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to load sales", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handler = () => {
      void load();
    };
    window.addEventListener("sales:refresh", handler);
    return () => window.removeEventListener("sales:refresh", handler);
  }, []);

  const filteredSales = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = [...safeSales];
    if (term) {
      result = result.filter(
        (sale) =>
          sale.sale_number.toLowerCase().includes(term) ||
          (typeof sale.customerId !== "string" &&
            sale.customerId?.name?.toLowerCase().includes(term))
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((sale) => sale.status === statusFilter);
    }
    if (customerFilter !== "all") {
      result = result.filter((sale) =>
        typeof sale.customerId === "string"
          ? sale.customerId === customerFilter
          : sale.customerId?._id === customerFilter
      );
    }
    return result;
  }, [safeSales, search, statusFilter, customerFilter]);

  const validate = (values: SaleForm) => {
    const next: string[] = [];
    if (!values.customerId) next.push("Customer is required.");
    if (!values.items.length) next.push("At least one line item is required.");
    values.items.forEach((item, idx) => {
      if (!item.name.trim()) next.push(`Item ${idx + 1}: name is required.`);
      if (item.quantity <= 0) next.push(`Item ${idx + 1}: quantity must be > 0.`);
      if (item.price <= 0) next.push(`Item ${idx + 1}: price must be > 0.`);
    });
    if (!isValidDate(values.date)) next.push("Enter a valid date.");
    setErrors(next);
    return next.length === 0;
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setErrors([]);
    setForm({
      customerId: "",
      items: [createEmptyItem()],
      status: "pending",
      paymentMethod: "card",
      date: "",
    });
    setOpen(true);
  };

  const handleOpenEdit = (sale: Sale) => {
    const customerId =
      typeof sale.customerId === "string" ? sale.customerId : sale.customerId?._id || "";
    setEditing(sale);
    setErrors([]);
    setForm({
      customerId,
      items: sale.items?.length ? sale.items.map((item) => ({ ...item })) : [createEmptyItem()],
      status: sale.status || "pending",
      paymentMethod: sale.paymentMethod || "card",
      date: sale.date ? new Date(sale.date).toISOString().slice(0, 10) : "",
    });
    setOpen(true);
  };

  const handleAddItem = () =>
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));

  const handleItemChange = (index: number, field: keyof SaleItem, value: string) => {
    setForm((prev) => {
      const next = [...prev.items];
      if (field === "name") {
        next[index][field] = value;
      } else {
        next[index][field] = Number(value) as never;
      }
      return { ...prev, items: next };
    });
  };

  const handleRemoveItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async () => {
    const payload: Partial<Sale> = {
      customerId: form.customerId,
      items: form.items,
      status: form.status,
      paymentMethod: form.paymentMethod,
    };

    if (form.date) payload.date = new Date(form.date).toISOString();

    if (!validate(form)) return;

    try {
      if (editing) {
        await saleService.updateByNumber(editing.sale_number, payload);
        showToast("Sale updated", "success");
      } else {
        await saleService.create(payload);
        showToast("Sale created", "success");
      }
      setOpen(false);
      await load();
    } catch (error) {
      logger.error("sale_save_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Sale action failed", "error");
    }
  };

  const handleAssignOpen = (sale: Sale) => {
    setAssigning(sale);
    setAssignUserId(
      typeof sale.assignedTo === "string" ? sale.assignedTo : sale.assignedTo?._id || ""
    );
  };

  const handleAssignSave = async () => {
    if (!assigning) return;
    try {
      await saleService.assignByNumber(assigning.sale_number, { assignedTo: assignUserId });
      showToast("Sale assigned", "success");
      setAssigning(null);
      setAssignUserId("");
      await load();
    } catch (error) {
      logger.error("sale_assign_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to assign sale", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await saleService.removeByNumber(confirmDelete.sale_number);
      showToast("Sale deleted", "info");
      setConfirmDelete(null);
      await load();
    } catch (error) {
      logger.error("sale_delete_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to delete sale", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Sales Pipeline</h2>
          <p className="text-sm text-muted-foreground">Track revenue and sales performance.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          New Sale
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card lg:grid-cols-4">
        <input
          className="rounded-lg border border-border px-3 py-2 text-sm"
          placeholder="Search by S# or customer"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Dropdown value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </Dropdown>
        <Dropdown value={customerFilter} onChange={setCustomerFilter}>
          <option value="all">All Customers</option>
          {safeCustomers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </Dropdown>
        <div className="flex items-center justify-end text-sm text-ink-muted">
          {filteredSales.length} sales
        </div>
      </div>

      {loading ? (
        <div className="card p-6">Loading sales...</div>
      ) : filteredSales.length === 0 ? (
        <div className="card p-6">No sales found.</div>
      ) : (
        <SaleList
          sales={filteredSales}
          onEdit={handleOpenEdit}
          onAssign={handleAssignOpen}
          onDelete={(sale) => setConfirmDelete(sale)}
        />
      )}

      <Modal title={editing ? "Edit Sale" : "Create Sale"} open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="w-full rounded-lg border border-slate-200 px-4 py-2 h-10"
              value={form.customerId}
              onChange={(e) => setForm((prev) => ({ ...prev, customerId: e.target.value }))}
            >
              <option value="">Select customer</option>
              {safeCustomers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.customer_number} - {customer.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 h-10"
              value={form.date}
              onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            {form.items.map((item, index) => (
              <div key={index} className="grid gap-2 items-center md:grid-cols-4">
                <input
                  className="col-span-2 w-full rounded-lg border border-border px-3 py-2 h-10"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, "name", e.target.value)}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 h-10"
                  placeholder="Qty"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                />
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 h-10"
                  placeholder="Price"
                  min={0}
                  value={item.price}
                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                />
                <button className="btn-ghost h-10" onClick={() => handleRemoveItem(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button className="btn-ghost" onClick={handleAddItem}>
            Add Line Item
          </button>

          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 h-10"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Sale["status"] }))}
            >
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 h-10"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, paymentMethod: e.target.value as Sale["paymentMethod"] }))
              }
            >
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="paypal">PayPal</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted">Total</div>
            <div className="text-lg font-semibold text-foreground">{formatCurrency(total)}</div>
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-text space-y-1">
              {errors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </div>
          )}

          <button className="btn-primary w-full" onClick={handleSubmit}>
            {editing ? "Save Changes" : "Save Sale"}
          </button>
        </div>
      </Modal>

      <AssignModal
        open={Boolean(assigning)}
        users={users}
        selectedUserId={assignUserId}
        saving={false}
        onChange={setAssignUserId}
        onClose={() => setAssigning(null)}
        onAssign={handleAssignSave}
      />

      <Modal title="Confirm Delete" open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Confirm: Do you want to delete sale {confirmDelete?.sale_number}?
          </p>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setConfirmDelete(null)}>
              Cancel
            </button>
            <button className="btn-primary flex-1" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
