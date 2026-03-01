import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import CustomerList from "../components/CustomerList";
import Dropdown from "../components/Dropdown";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import { customerService } from "../services/customer.service";
import { saleService } from "../services/sale.service";
import { taskService } from "../services/task.service";
import { Customer, Sale, Task } from "../types";
import { logger } from "../utils/logger";

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

const emptyForm: CustomerForm = { name: "", email: "", phone: "", address: "" };

const isValidEmail = (value: string) =>
  !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidPhone = (value: string) => !value || /^[+\d][\d\s-]{6,}$/.test(value);

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("customer_number");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<Partial<CustomerForm>>({});
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const safeCustomers = useMemo(() => {
    const list = Array.isArray(customers) ? customers.filter(Boolean) : [];
    const term = query.trim().toLowerCase();
    let filtered = list;
    if (term) {
      filtered = list.filter(
        (customer) =>
          customer.name.toLowerCase().includes(term) ||
          customer.customer_number.toLowerCase().includes(term)
      );
    }
    filtered.sort((a, b) => {
      if (sortBy === "customer_number") {
        return a.customer_number.localeCompare(b.customer_number);
      }
      return a.name.localeCompare(b.name);
    });
    return filtered;
  }, [customers, query, sortBy]);

  const loadCustomers = async (search?: string) => {
    try {
      setLoading(true);
      const [customerData, taskData, saleData] = await Promise.all([
        customerService.list(search),
        taskService.list(),
        saleService.list(),
      ]);
      setCustomers(customerData);
      setTasks(taskData);
      setSales(saleData);
    } catch (error) {
      logger.error("customers_load_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCustomers();
  }, []);

  useEffect(() => {
    const handler = () => {
      void loadCustomers(query);
    };
    window.addEventListener("customers:refresh", handler);
    return () => window.removeEventListener("customers:refresh", handler);
  }, [query]);

  const validate = (values: CustomerForm) => {
    const next: Partial<CustomerForm> = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!isValidEmail(values.email)) next.email = "Enter a valid email.";
    if (!isValidPhone(values.phone)) next.phone = "Enter a valid phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleOpenCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setErrors({});
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!validate(form)) return;
    try {
      if (editing) {
        await customerService.updateByNumber(editing.customer_number, form);
        showToast("Customer updated", "success");
      } else {
        await customerService.create(form);
        showToast("Customer created", "success");
      }
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
      await loadCustomers(query);
    } catch (error) {
      logger.error("customer_save_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Customer action failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await customerService.removeByNumber(confirmDelete.customer_number);
      showToast("Customer deleted", "info");
      setConfirmDelete(null);
      await loadCustomers(query);
    } catch (error) {
      logger.error("customer_delete_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to delete customer", "error");
    }
  };

  const customerRecentPurchase = (customerId: string) => {
    const customerSales = sales
      .filter((sale) => (typeof sale.customerId === "string" ? sale.customerId : sale.customerId?._id) === customerId)
      .sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
    return customerSales[0] || null;
  };

  const customerTasks = (customerId: string) =>
    tasks.filter((task) => task.relatedToType === "customer" && task.relatedToId === customerId);

  const handleAssignTask = async (taskNumber: number) => {
    const userId = window.prompt("Enter assignee user id");
    if (!userId) return;
    try {
      await taskService.assignByNumber(taskNumber, { assignedTo: userId });
      showToast("Task assignment updated", "success");
      await loadCustomers(query);
    } catch (error) {
      logger.error("customer_assign_task_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to assign task", "error");
    }
  };

  const handleUnassignTask = async (taskNumber: number) => {
    try {
      await taskService.unassignByNumber(taskNumber);
      showToast("Task unassigned", "success");
      await loadCustomers(query);
    } catch (error) {
      logger.error("customer_unassign_task_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast("Failed to unassign task", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Customer Directory</h2>
          <p className="text-sm text-muted-foreground">Manage your relationships and accounts.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate}>
          Add Customer
        </button>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <input
          className="flex-1 rounded-lg border border-border px-4 py-2"
          placeholder="Search by name or C#"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Dropdown value={sortBy} onChange={setSortBy}>
          <option value="customer_number">Sort by Customer #</option>
          <option value="name">Sort by Name</option>
        </Dropdown>
      </div>

      {loading ? (
        <div className="card p-6">Loading customers...</div>
      ) : safeCustomers.length === 0 ? (
        <div className="card p-6">No customers found.</div>
      ) : (
        <CustomerList
          customers={safeCustomers}
          onEdit={handleOpenEdit}
          onDelete={(customer) => setConfirmDelete(customer)}
        />
      )}

      {safeCustomers.length ? (
        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Purchase History and Task Assignment</h3>
          {safeCustomers.map((customer) => {
            const recentSale = customerRecentPurchase(customer._id);
            const relatedTasks = customerTasks(customer._id);
            return (
              <div key={`ops-${customer._id}`} className="rounded-lg border border-border p-3">
                <div className="text-sm font-semibold text-muted-foreground">{customer.name}</div>
                <div className="text-xs text-muted">
                  Recent purchase:{" "}
                  {recentSale ? `${recentSale.sale_number} - $${recentSale.total.toFixed(2)}` : "No purchases yet"}
                </div>
                <div className="mt-2 space-y-2">
                  {relatedTasks.length ? (
                    relatedTasks.map((task) => (
                      <div key={`task-${task._id}`} className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground">Task #{task.task_number}</span>
                        <span className="text-muted">{task.title}</span>
                        <button
                          className="btn-ghost text-xs"
                          onClick={() => handleAssignTask(task.task_number)}
                        >
                          Assign
                        </button>
                        <button className="btn-ghost text-xs" onClick={() => handleUnassignTask(task.task_number)}>
                          Unassign
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted">No customer-linked tasks.</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <Modal
        title={editing ? "Edit Customer" : "Add Customer"}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name ? <p className="mt-1 text-xs text-danger-text">{errors.name}</p> : null}
          </div>
          <div>
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors.email ? <p className="mt-1 text-xs text-danger-text">{errors.email}</p> : null}
          </div>
          <div>
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {errors.phone ? <p className="mt-1 text-xs text-danger-text">{errors.phone}</p> : null}
          </div>
          <div>
            <input
              className="w-full rounded-lg border border-slate-200 px-4 py-2"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <button className="btn-primary w-full" onClick={handleSubmit}>
            {editing ? "Save Changes" : "Save Customer"}
          </button>
        </div>
      </Modal>

      <Modal
        title="Confirm Delete"
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Confirm: Do you want to delete customer {confirmDelete?.customer_number}?
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

      {toast ? <Toast message={toast.message} type={toast.type} onClose={hideToast} /> : null}
    </div>
  );
}
