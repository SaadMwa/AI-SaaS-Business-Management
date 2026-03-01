import { useEffect, useMemo, useState } from "react";
import Modal from "./Modal";
import { productService, Product } from "../services/product.service";
import { userService } from "../services/user.service";
import { taskService } from "../services/task.service";
import { Task } from "../types";
import { AssignableUser } from "../services/user.service";

type FormEntityType = "task" | "sale" | "customer" | "product";

type UiAction = {
  type: "open_form";
  entityType: FormEntityType;
  mode: "create" | "update";
  prefill?: Record<string, unknown>;
} | null;

export default function AiEntityFormModal({
  action,
  open,
  onClose,
  onSubmit,
  submitting,
}: {
  action: UiAction;
  open: boolean;
  onClose: () => void;
  onSubmit: (params: { entityType: FormEntityType; mode: "create" | "update"; payload: Record<string, unknown> }) => Promise<void>;
  submitting: boolean;
}) {
  const entityType = action?.entityType || "task";
  const mode = action?.mode || "create";

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    if (!open || !action) return;
    setForm(action.prefill || {});
    setErrors({});
    setProductSearch("");
  }, [open, action]);

  useEffect(() => {
    if (!open) return;
    if (entityType === "sale" || entityType === "product") {
      void productService
        .list()
        .then((result) => setProducts(result.products || []))
        .catch(() => setProducts([]));
    }
    if (entityType === "task") {
      void userService.list().then(setUsers).catch(() => setUsers([]));
    }
    if (entityType === "customer") {
      void taskService.list().then(setTasks).catch(() => setTasks([]));
    }
  }, [open, entityType]);

  const selectedProduct = useMemo(() => {
    if (!form.productId) return null;
    return products.find((item) => item._id === form.productId) || null;
  }, [products, form.productId]);

  const computedTotal = useMemo(() => {
    const qty = Number(form.quantity || 0);
    const price = Number(selectedProduct?.price || 0);
    return qty > 0 ? qty * price : 0;
  }, [form.quantity, selectedProduct]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return products;
    return products.filter((item) => item.name.toLowerCase().includes(term));
  }, [products, productSearch]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (entityType === "task") {
      if (mode === "update") {
        const num = Number(form.task_number || form.taskNumber);
        if (!Number.isFinite(num) || num <= 0) next.task_number = "Task number is required for update";
      }
      if (!String(form.title || "").trim()) next.title = "Title is required";
      if (!String(form.description || "").trim()) next.description = "Description is required";
      if (!String(form.status || "").trim()) next.status = "Status is required";
    }
    if (entityType === "sale") {
      if (mode === "update") {
        const num = Number(form.sale_number || form.saleNumber);
        if (!Number.isFinite(num) || num <= 0) next.sale_number = "Sale number is required for update";
      }
      if (!String(form.productId || "").trim()) next.productId = "Product is required";
      const qty = Number(form.quantity || 0);
      if (!Number.isFinite(qty) || qty <= 0) next.quantity = "Quantity must be greater than 0";
    }
    if (entityType === "customer") {
      if (mode === "update") {
        const num = Number(form.customer_number || form.customerNumber);
        if (!Number.isFinite(num) || num <= 0) next.customer_number = "Customer number is required for update";
      }
      if (!String(form.name || "").trim()) next.name = "Name is required";
      if (String(form.email || "").trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email))) {
        next.email = "Email is invalid";
      }
    }
    if (entityType === "product") {
      if (!String(form.name || "").trim()) next.name = "Name is required";
      if (!String(form.description || "").trim()) next.description = "Description is required";
      const price = Number(form.price || 0);
      if (!Number.isFinite(price) || price < 0) next.price = "Price must be a valid number";
      const stock = Number(form.stock_quantity || 0);
      if (!Number.isFinite(stock) || stock < 0) next.stock_quantity = "Stock must be a valid number";
      if (!/^https?:\/\/\S+/i.test(String(form.image_url || ""))) next.image_url = "Valid image URL is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const payload: Record<string, unknown> = { ...form };
    if (entityType === "sale") {
      payload.total = computedTotal;
      if (!payload.productName && selectedProduct?.name) {
        payload.productName = selectedProduct.name;
      }
    }
    await onSubmit({ entityType, mode, payload });
  };

  const setField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderFieldError = (key: string) =>
    errors[key] ? <div className="mt-1 text-xs text-danger-text">{errors[key]}</div> : null;

  const handleCancel = () => {
    setForm({});
    setErrors({});
    setProductSearch("");
    onClose();
  };

  return (
    <Modal
      title={`AI ${mode === "create" ? "Create" : "Update"} ${entityType}`}
      open={open}
      onClose={handleCancel}
    >
      <div className="space-y-4">
        {entityType === "task" ? (
          <>
            {mode === "update" ? (
              <div>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Task number"
                  value={String(form.task_number || form.taskNumber || "")}
                  onChange={(e) => setField("task_number", Number(e.target.value))}
                />
                {renderFieldError("task_number")}
              </div>
            ) : null}
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Title"
                value={String(form.title || "")}
                onChange={(e) => setField("title", e.target.value)}
              />
              {renderFieldError("title")}
            </div>
            <div>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Description"
                value={String(form.description || "")}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
              />
              {renderFieldError("description")}
            </div>
            <div>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={String(form.assignedTo || "")}
                onChange={(e) => setField("assignedTo", e.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={String(form.status || "pending")}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
              {renderFieldError("status")}
            </div>
          </>
        ) : null}

        {entityType === "sale" ? (
          <>
            {mode === "update" ? (
              <div>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Sale number"
                  value={String(form.sale_number || form.saleNumber || "")}
                  onChange={(e) => setField("sale_number", Number(e.target.value))}
                />
                {renderFieldError("sale_number")}
              </div>
            ) : null}
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Search product..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                value={String(form.productId || "")}
                onChange={(e) => setField("productId", e.target.value)}
              >
                <option value="">Select product</option>
                {filteredProducts.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} (${product.price}) - stock {product.stock_quantity}
                  </option>
                ))}
              </select>
              {renderFieldError("productId")}
            </div>
            <div>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Quantity"
                value={Number(form.quantity || 0) || ""}
                onChange={(e) => setField("quantity", Number(e.target.value))}
              />
              {renderFieldError("quantity")}
            </div>
            <div className="rounded-lg bg-card-muted px-3 py-2 text-sm text-muted-foreground">
              Total: ${computedTotal.toFixed(2)}
            </div>
          </>
        ) : null}

        {entityType === "customer" ? (
          <>
            {mode === "update" ? (
              <div>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Customer number"
                  value={String(form.customer_number || form.customerNumber || "")}
                  onChange={(e) => setField("customer_number", Number(e.target.value))}
                />
                {renderFieldError("customer_number")}
              </div>
            ) : null}
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Name"
                value={String(form.name || "")}
                onChange={(e) => setField("name", e.target.value)}
              />
              {renderFieldError("name")}
            </div>
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Email"
                value={String(form.email || "")}
                onChange={(e) => setField("email", e.target.value)}
              />
              {renderFieldError("email")}
            </div>
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Phone"
                value={String(form.phone || "")}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Assign tasks (optional)</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                multiple
                value={Array.isArray(form.assignedTasks) ? (form.assignedTasks as Array<number | string>).map(String) : []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
                  setField("assignedTasks", selected);
                }}
              >
                {tasks.map((task) => (
                  <option key={task._id} value={task.task_number}>
                    #{task.task_number} - {task.title}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}

        {entityType === "product" ? (
          <>
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Name"
                value={String(form.name || "")}
                onChange={(e) => setField("name", e.target.value)}
              />
              {renderFieldError("name")}
            </div>
            <div>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Description"
                rows={3}
                value={String(form.description || "")}
                onChange={(e) => setField("description", e.target.value)}
              />
              {renderFieldError("description")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Price"
                  value={Number(form.price || 0) || ""}
                  onChange={(e) => setField("price", Number(e.target.value))}
                />
                {renderFieldError("price")}
              </div>
              <div>
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Stock"
                  value={Number(form.stock_quantity || 0) || ""}
                  onChange={(e) => setField("stock_quantity", Number(e.target.value))}
                />
                {renderFieldError("stock_quantity")}
              </div>
            </div>
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Category"
                value={String(form.category || "")}
                onChange={(e) => setField("category", e.target.value)}
              />
            </div>
            <div>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="Image URL"
                value={String(form.image_url || "")}
                onChange={(e) => setField("image_url", e.target.value)}
              />
              {renderFieldError("image_url")}
            </div>
          </>
        ) : null}

        <div className="flex gap-2">
          <button className="btn-ghost flex-1" type="button" onClick={handleCancel} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary flex-1" type="button" onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <span className="btn-inline-spinner" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
