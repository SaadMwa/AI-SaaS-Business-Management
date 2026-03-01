import { type FormEvent, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "../services/api";
import { Product, productService } from "../services/product.service";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  stock_quantity: string;
  image_url: string;
  category: string;
  is_recommended: boolean;
  popularity_score: string;
  top_selling: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock_quantity: "",
  image_url: "",
  category: "General",
  is_recommended: false,
  popularity_score: "50",
  top_selling: false,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<"create" | "update" | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [marketingCaptions, setMarketingCaptions] = useState<string>("");

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.list();
      setProducts(result.products || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const title = useMemo(() => (editingId ? "Update product" : "Add product"), [editingId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setMarketingCaptions("");
  };

  const generateDescription = async () => {
    if (!form.name.trim()) {
      setError("Enter product name first.");
      return;
    }
    try {
      setGeneratingDescription(true);
      setError(null);
      const content = await productService.generateAiContent({
        type: "description",
        name: form.name.trim(),
        category: form.category.trim() || "General",
        price: Number(form.price) || undefined,
      });
      setForm((prev) => ({ ...prev, description: content }));
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "success", message: "AI description generated." },
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingDescription(false);
    }
  };

  const generateCaption = async () => {
    if (!form.name.trim()) {
      setError("Enter product name first.");
      return;
    }
    try {
      setGeneratingCaption(true);
      setError(null);
      const content = await productService.generateAiContent({
        type: "caption",
        name: form.name.trim(),
        category: form.category.trim() || "General",
        price: Number(form.price) || undefined,
        description: form.description.trim() || undefined,
      });
      setMarketingCaptions(content);
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "success", message: "AI captions generated." },
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      image_url: form.image_url.trim(),
      category: form.category.trim() || "General",
      is_recommended: form.is_recommended,
      popularity_score: Number(form.popularity_score),
      top_selling: form.top_selling,
    };

    try {
      if (editingId) {
        const updated = await productService.update(editingId, payload);
        setProducts((prev) => prev.map((item) => (item._id === editingId ? updated : item)));
        setSavedFlash("update");
      } else {
        const created = await productService.create(payload);
        setProducts((prev) => [created, ...prev]);
        setSavedFlash("create");
      }
      resetForm();
      window.setTimeout(() => setSavedFlash(null), 1000);
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: {
            type: "success",
            message: editingId ? "Product updated successfully." : "Product created successfully.",
          },
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setMarketingCaptions("");
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock_quantity: String(product.stock_quantity),
      image_url: product.image_url,
      category: product.category || "General",
      is_recommended: Boolean(product.is_recommended),
      popularity_score: String(product.popularity_score ?? 50),
      top_selling: Boolean(product.top_selling),
    });
  };

  const removeProduct = async (id: string) => {
    setError(null);
    try {
      await productService.remove(id);
      setProducts((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Image URL" value={form.image_url} onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Price" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Stock quantity" value={form.stock_quantity} onChange={(e) => setForm((prev) => ({ ...prev, stock_quantity: e.target.value }))} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Category" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
          <input className="rounded-lg border border-border px-3 py-2" placeholder="Popularity score (0-100)" value={form.popularity_score} onChange={(e) => setForm((prev) => ({ ...prev, popularity_score: e.target.value }))} />
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input type="checkbox" checked={form.is_recommended} onChange={(e) => setForm((prev) => ({ ...prev, is_recommended: e.target.checked }))} />
            Recommended product
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input type="checkbox" checked={form.top_selling} onChange={(e) => setForm((prev) => ({ ...prev, top_selling: e.target.checked }))} />
            Top-selling product
          </label>
          <textarea className="md:col-span-2 rounded-lg border border-slate-200 px-3 py-2" rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button className="btn-ghost" type="button" onClick={() => void generateDescription()} disabled={generatingDescription || saving}>
              {generatingDescription ? "Generating description..." : "AI Generate Description"}
            </button>
            <button className="btn-ghost" type="button" onClick={() => void generateCaption()} disabled={generatingCaption || saving}>
              {generatingCaption ? "Generating captions..." : "AI Generate Marketing Captions"}
            </button>
          </div>
          {marketingCaptions ? (
            <div className="md:col-span-2 rounded-lg border border-border bg-card-muted px-3 py-2 text-sm whitespace-pre-wrap">
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted">Marketing Captions</p>
              {marketingCaptions}
            </div>
          ) : null}
          <div className="md:col-span-2 flex gap-2">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <span className="btn-inline-spinner" />
                  Saving...
                </>
              ) : editingId ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>
            {editingId ? (
              <button className="btn-ghost" type="button" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        {savedFlash ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-success-text">
            <span className="checkmark-pop inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs">
              OK
            </span>
            {savedFlash === "create" ? "Product created" : "Product updated"}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-danger-text">{error}</p> : null}
      </section>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Products</h2>
          <button className="btn-ghost" onClick={() => void loadProducts()}>Refresh</button>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`products-skeleton-${idx}`} className="rounded-xl border border-border bg-card p-4">
                <div className="skeleton h-40 w-full rounded-lg" />
                <div className="skeleton mt-3 h-4 w-3/4 rounded" />
                <div className="skeleton mt-2 h-3 w-full rounded" />
                <div className="skeleton mt-2 h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : null}
        {!loading && products.length === 0 ? <p>No products found.</p> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product._id} className="lift-hover overflow-hidden rounded-xl border border-border bg-card p-4">
              <div className="overflow-hidden rounded-lg">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-40 w-full object-cover"
                />
              </div>
              <h3 className="mt-3 font-semibold text-foreground">{product.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
              <p className="mt-2 text-sm font-semibold">Price: ${product.price.toFixed(2)}</p>
              <p className="text-sm">Stock: {product.stock_quantity}</p>
              <p className="text-sm">Category: {product.category || "General"}</p>
              <p className="text-xs text-muted">{product.top_selling ? "Top-selling" : "Standard"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.top_selling ? <span className="chip chip-success pulse-alert">Best Seller</span> : null}
                {product.stock_quantity > 0 && product.stock_quantity <= 5 ? (
                  <span className="chip chip-warning pulse-alert">Low Stock</span>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost" onClick={() => startEdit(product)}>Edit</button>
                <button className="btn-ghost" onClick={() => void removeProduct(product._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
