import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getErrorMessage } from "../services/api";
import { Product, productService } from "../services/product.service";
import { resolveApiBaseUrl } from "../config/env";
import Modal from "../components/Modal";
import { useTheme } from "../context/theme.context";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import ChatUI from "../components/ChatUI";
import ProductCard from "../components/ProductCard";

const AI_URL = `${resolveApiBaseUrl()}/ai`;

type SortMode = "recommended" | "priceAsc" | "priceDesc";
type StockFilter = "all" | "inStock" | "outOfStock";
type CategoryFilter = "all" | string;
type ChatTab = "chat" | "guide" | "history";
type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  stock_quantity: number;
};

type ChatCard = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  stock_label: string;
  stock_quantity: number;
  category: string;
  popularity_score: number;
  is_recommended?: boolean;
  top_selling?: boolean;
  view_details_link?: string;
  key_feature?: string;
  match_reason?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  products?: ChatCard[];
  quickActions?: string[];
  stage?: string;
};

type StoreAiResponse = {
  success?: boolean;
  message?: string;
  answer?: string;
  products?: ChatCard[];
  sessionId?: string;
  responseType?: "product_list" | "product_detail" | "text";
  intent?: string;
  stage?: string;
  quick_actions?: string[];
  found?: boolean;
  entities?: {
    category?: string | null;
    max_price?: number | null;
    product_name?: string | null;
    min_price?: number | null;
  };
};

type PersistedHistory = {
  sessionId: string;
  messages: ChatMessage[];
};

const createSessionId = () => {
  const random = Math.random().toString(36).slice(2);
  return `visitor-session-${Date.now()}-${random}`;
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const historyStorageKey = "store_ai_history_v1";
const cartStorageKey = "store_cart_v1";

const guideExamples = [
  "Do you have headphones in stock?",
  "Show me top-selling products",
  "Recommend 3 gadgets under $100",
  "Tell me more about the smart fitness watch",
];
const quickPromptChips = ["Do you have wireless headphones?", "Best sellers", "Recommend under $100"];

const defaultWelcome: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi, I can help with product price, stock, descriptions, recommendations, and popular items.",
  timestamp: new Date().toISOString(),
};

export default function StorePage() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{ id: string; label: string; category: string }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [popularOnly, setPopularOnly] = useState(false);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTab, setChatTab] = useState<ChatTab>("chat");
  const [assistantTyping, setAssistantTyping] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [question, setQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => createSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>([defaultWelcome]);
  const [inputFocused, setInputFocused] = useState(false);
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(historyStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PersistedHistory;
      if (!parsed?.sessionId || !Array.isArray(parsed.messages)) return;
      setSessionId(parsed.sessionId);
      setMessages(parsed.messages.length ? parsed.messages : [defaultWelcome]);
    } catch {
      // Ignore corrupted storage.
    }
  }, []);

  useEffect(() => {
    const payload: PersistedHistory = { sessionId, messages };
    localStorage.setItem(historyStorageKey, JSON.stringify(payload));
  }, [messages, sessionId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cartStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) setCartItems(parsed);
    } catch {
      // Ignore corrupted cart storage.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    const load = async () => {
      try {
        const storeIdFromQuery =
          searchParams.get("store_id") || searchParams.get("store") || undefined;
        const result = await productService.list({
          store_id: storeIdFromQuery || user?.store_id || undefined,
        });
        setProducts(result.products || []);
        setFeaturedProducts(result.featuredProducts || []);
        setBestSellers(result.bestSellers || []);
        setLowStockAlerts(result.lowStockAlerts || []);
        setSmartSuggestions(result.smartSuggestions || []);
        setCategories(result.categories || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [searchParams, user?.store_id]);

  useEffect(() => {
    const productId = searchParams.get("product");
    if (!productId) return;
    const found = products.find((item) => item._id === productId);
    if (found) setSelectedProduct(found);
  }, [searchParams, products]);

  useEffect(() => {
    if (chatScrollRef.current && chatTab === "chat") {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, chatOpen, chatTab]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const fromProducts = products
      .filter((product) => {
        const haystack = `${product.name} ${product.description} ${product.category || ""}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 4);
    const fromAi = smartSuggestions
      .filter((suggestion) => suggestion.label.toLowerCase().includes(q))
      .slice(0, 4)
      .map((suggestion) => {
        return (
          products.find((product) => product._id === suggestion.id) || {
            _id: suggestion.id,
            name: suggestion.label,
            description: "",
            price: 0,
            stock_quantity: 0,
            image_url: "",
            category: suggestion.category,
            store_id: "",
          }
        );
      });
    const deduped = new Map<string, Product>();
    [...fromProducts, ...fromAi].forEach((item) => {
      if (!deduped.has(item._id)) deduped.set(item._id, item);
    });
    return Array.from(deduped.values()).slice(0, 6);
  }, [products, query, smartSuggestions]);

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = products.filter((product) => {
      const matchesQuery =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q);
      if (!matchesQuery) return false;
      if (stockFilter === "inStock" && product.stock_quantity <= 0) return false;
      if (stockFilter === "outOfStock" && product.stock_quantity > 0) return false;
      if (categoryFilter !== "all" && (product.category || "General") !== categoryFilter) return false;
      if (popularOnly && !product.top_selling) return false;
      return true;
    });

    if (sortMode === "priceAsc") {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortMode === "priceDesc") {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else {
      filtered = [...filtered].sort((a, b) => {
        const left = (a.top_selling ? 150 : 0) + (a.is_recommended ? 100 : 0) + (a.popularity_score || 0);
        const right =
          (b.top_selling ? 150 : 0) + (b.is_recommended ? 100 : 0) + (b.popularity_score || 0);
        return right - left;
      });
    }

    return filtered;
  }, [products, query, sortMode, stockFilter, categoryFilter, popularOnly]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );
  const addToCart = (item: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    stock_quantity: number;
  }) => {
    if (item.stock_quantity <= 0) return;
    setCartItems((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const changeCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const next = Math.max(0, Math.min(item.stock_quantity, item.quantity + delta));
          return { ...item, quantity: next };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const checkout = () => {
    if (!cartItems.length) return;
    setCheckoutOpen(true);
  };

  const confirmCheckout = () => {
    setCartItems([]);
    setCartOpen(false);
    setCheckoutOpen(false);
  };

  const pushMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const askAi = async (event?: FormEvent, presetQuestion?: string) => {
    event?.preventDefault();
    const prompt = (presetQuestion ?? question).trim();
    if (!prompt || aiLoading) return;

    pushMessage({
      id: `u-${Date.now()}`,
      role: "user",
      text: prompt,
      timestamp: new Date().toISOString(),
    });

    setAiLoading(true);
    setAssistantTyping(true);
    setQuestion("");
    setChatTab("chat");
    setChatOpen(true);
    const startedAt = Date.now();

    const sendRequest = async () => {
      const response = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt, sessionId }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }
      return (await response.json()) as StoreAiResponse;
    };

    try {
      let data: StoreAiResponse | null = null;
      try {
        data = await sendRequest();
      } catch {
        data = await sendRequest();
      }
      const resolvedAnswer =
        typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : typeof data?.answer === "string" && data.answer.trim()
            ? data.answer.trim()
            : "I hit a temporary response issue. Please try once more.";
      const safeProducts = Array.isArray(data?.products) ? data.products : [];
      const quickActions = Array.isArray(data?.quick_actions) ? data?.quick_actions : [];
      if (data?.sessionId) setSessionId(data.sessionId);
      const elapsed = Date.now() - startedAt;
      const minDelay = 900;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      pushMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        text: resolvedAnswer,
        products: safeProducts,
        quickActions,
        stage: data?.stage,
        timestamp: new Date().toISOString(),
      });
    } catch {
      const elapsed = Date.now() - startedAt;
      const minDelay = 900;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      pushMessage({
        id: `a-${Date.now()}`,
        role: "assistant",
        text: "One moment please... I'm having a small delay. Let me try again for you.",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setAiLoading(false);
      setAssistantTyping(false);
    }
  };

  const clearAllHistory = () => {
    const fresh = createSessionId();
    setSessionId(fresh);
    setMessages([defaultWelcome]);
    localStorage.removeItem(historyStorageKey);
  };

  const clearOne = (id: string) => {
    setMessages((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [defaultWelcome];
    });
  };

  const handleQuestionKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void askAi();
    }
  };

  return (
    <div className="min-h-screen bg-surface-raised px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-border bg-card/80 p-6 shadow-soft backdrop-blur-sm sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">Public Store</p>
              <h1 className="mt-2 text-4xl font-semibold text-foreground">Find the Right Product Fast</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Explore curated electronics, accessories, and gadgets. Use search, smart filters, and the AI assistant
                for recommendations and availability checks.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn-ghost" onClick={toggleTheme} type="button">
                {theme === "system" ? `System (${resolvedTheme})` : `${theme} mode`}
              </button>
              <Link to="/login" className="btn-primary">
                Admin Login
              </Link>
            </div>
          </div>
        </header>

        <section className="card p-5">
          <div className="grid gap-3 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <input
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Search products..."
                value={query}
                onFocus={() => setSuggestionOpen(true)}
                onBlur={() => setTimeout(() => setSuggestionOpen(false), 120)}
                onChange={(e) => setQuery(e.target.value)}
              />
              {suggestionOpen && suggestions.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-card shadow-card">
                  {suggestions.map((product) => (
                    <button
                      key={product._id}
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm transition hover:bg-card-muted"
                      onMouseDown={() => {
                        setQuery(product.name);
                        setSuggestionOpen(false);
                      }}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
            >
              <option value="recommended">Recommended / Popular</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            >
              <option value="all">All Stock</option>
              <option value="inStock">In Stock</option>
              <option value="outOfStock">Out of Stock</option>
            </select>
            <select
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={popularOnly}
                onChange={(e) => setPopularOnly(e.target.checked)}
              />
              Top-selling only
            </label>
          </div>
        </section>

        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={`store-product-skeleton-${idx}`} className="rounded-xl border border-border bg-card p-4">
                <div className="skeleton h-48 w-full rounded-lg" />
                <div className="skeleton mt-4 h-4 w-3/4 rounded" />
                <div className="skeleton mt-2 h-3 w-full rounded" />
                <div className="skeleton mt-3 h-3 w-1/3 rounded" />
                <div className="skeleton mt-4 h-9 w-full rounded-lg" />
              </div>
            ))}
          </section>
        ) : null}
        {error ? <p className="text-danger-text">{error}</p> : null}

        {featuredProducts.length ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Featured Products</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-muted">AI Tagged</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((product) => (
                <button
                  key={product._id}
                  className="lift-hover rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-border-strong"
                  onClick={() => setSelectedProduct(product)}
                >
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category || "General"}</p>
                  <p className="mt-1 text-sm text-muted">${product.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {bestSellers.length ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Best Sellers</h2>
              <span className="badge badge-success">Top performing</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.slice(0, 4).map((product) => (
                <button
                  key={product._id}
                  className="lift-hover rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-border-strong"
                  onClick={() => setSelectedProduct(product)}
                >
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category || "General"}</p>
                  <p className="mt-1 text-sm text-muted">${product.price.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product, index) => (
            <article
              key={product._id}
              className="card lift-hover group overflow-hidden animate-rise"
              style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
            >
              <div className="overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted">
                  {product.category || "General"}
                </p>
                <p className="mt-3 text-base font-semibold text-foreground">${product.price.toFixed(2)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span
                    className={`badge ${product.stock_quantity > 0 ? "badge-success" : "badge-warning"}`}
                  >
                    {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                  </span>
                  {product.stock_quantity > 0 && product.stock_quantity <= 5 ? (
                    <span className="badge badge-warning">Low Stock</span>
                  ) : null}
                  {product.top_selling ? <span className="badge badge-success">Best Seller</span> : null}
                  {product.is_recommended ? <span className="badge badge-info">Recommended</span> : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => setSelectedProduct(product)}>
                    View Details
                  </button>
                  <button
                    className="btn-primary flex-1"
                    onClick={() =>
                      addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        stock_quantity: product.stock_quantity,
                      })
                    }
                    disabled={product.stock_quantity <= 0}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
        {!loading && !error && visibleProducts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No products match your filters. Try clearing search or adjusting categories.
          </div>
        ) : null}

        {bestSellers.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">People Also Bought</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers
                .filter((item) => !cartItems.some((cartItem) => cartItem.id === item._id))
                .slice(0, 4)
                .map((product) => (
                  <button
                    key={product._id}
                    className="lift-hover rounded-xl border border-border bg-card p-3 text-left"
                    onClick={() =>
                      addToCart({
                        id: product._id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        stock_quantity: product.stock_quantity,
                      })
                    }
                  >
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.category || "General"}</p>
                    <p className="mt-1 text-sm text-muted">${product.price.toFixed(2)}</p>
                  </button>
                ))}
            </div>
          </section>
        ) : null}
      </div>

      <Modal
        title={selectedProduct?.name || "Product"}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      >
        {selectedProduct ? (
          <div className="space-y-4">
            <img src={selectedProduct.image_url} alt={selectedProduct.name} className="h-64 w-full rounded-lg object-cover" />
            <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
            <p className="text-lg font-semibold text-foreground">${selectedProduct.price.toFixed(2)}</p>
            <p className="text-sm">{selectedProduct.stock_quantity > 0 ? "In Stock" : "Out of Stock"}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={() =>
                  addToCart({
                    id: selectedProduct._id,
                    name: selectedProduct.name,
                    price: selectedProduct.price,
                    image_url: selectedProduct.image_url,
                    stock_quantity: selectedProduct.stock_quantity,
                  })
                }
                disabled={selectedProduct.stock_quantity <= 0}
              >
                Add to Cart
              </button>
              <button className="btn-ghost" onClick={() => setSelectedProduct(null)}>
                Close
              </button>
            </div>
          </div>
        ) : null}
      </Modal>

      <button
        type="button"
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-card"
      >
        {chatOpen ? "Close AI" : "AI Chat"}
      </button>

      {chatOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/55 p-4 backdrop-blur-[2px] sm:p-6" onClick={() => setChatOpen(false)}>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="store-ai-shell mx-auto flex h-[min(92vh,860px)] w-[min(98vw,940px)] min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative shrink-0 overflow-hidden border-b border-border px-5 py-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.14),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(14,116,144,0.1),transparent_50%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold tracking-tight text-foreground">Store Assistant</p>
                  <p className="text-xs text-muted-foreground">Smart product guidance with conversational memory</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-100/40 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
                    Online
                  </div>
                  <button type="button" className="btn-ghost text-xs" onClick={() => setChatOpen(false)}>
                    Close
                  </button>
                </div>
              </div>
              <div className="mt-3 rounded-full border border-border bg-card-muted p-1">
                {(["chat", "guide", "history"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={`store-tab-btn ${chatTab === tab ? "store-tab-btn-active" : ""}`}
                    onClick={() => setChatTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {chatTab === "guide" ? (
            <div className="scrollbar-subtle flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-surface-raised px-5 py-5 text-sm">
              <p className="text-sm font-semibold text-foreground">How to use store AI</p>
              <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
                <li>Ask about price, stock, details, popular items, or recommendations.</li>
                <li>Try filters first, then ask AI for narrowed suggestions.</li>
                <li>Use follow-up prompts like "What about cheaper options?"</li>
              </ol>
              <div className="grid gap-2">
                {guideExamples.map((example) => (
                  <button
                    key={example}
                    className="rounded-xl border border-border bg-card px-3 py-2 text-left text-sm transition duration-200 hover:scale-[1.01] hover:border-primary hover:text-primary"
                    onClick={() => void askAi(undefined, example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {chatTab === "history" ? (
            <div className="scrollbar-subtle flex-1 overflow-y-auto overflow-x-hidden bg-surface-raised px-5 py-5">
              <div className="mb-2 flex justify-end">
                <button className="btn-ghost text-xs" onClick={clearAllHistory}>Clear All</button>
              </div>
              <div className="space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted">{message.role}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                        {message.id !== "welcome" ? (
                          <button className="text-xs text-danger-text" onClick={() => clearOne(message.id)}>
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{message.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {chatTab === "chat" ? (
            <>
              <div ref={chatScrollRef} className="scrollbar-hidden relative min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-surface-raised px-5 py-5">
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(14,116,144,0.08),transparent_46%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.09),transparent_42%)]" />
                {messages.length <= 1 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center">
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-primary/10 p-2.5 text-primary">
                      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full" aria-hidden="true">
                        <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8h-2l-4 2 .8-3.2A8 8 0 0 1 4 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-foreground">Ask anything about products</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try: "Do you have a smart watch under $200?"</p>
                  </div>
                ) : null}
                {messages.map((message) => (
                  <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
                    <ChatUI role={message.role} text={message.text} timestamp={message.timestamp} />
                  {message.products && message.products.length > 0 ? (
  <div className="mt-2 space-y-2">
    {message.products.map((product) => {
      // ONE-LINE FIX: Cast the product to any to bypass type checking
      const productForCard = product as any;
      
      return (
        <ProductCard
          key={product.id}
          product={productForCard}
          onAddToCart={() =>
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              stock_quantity: product.stock_quantity,
            })
          }
        />
      );
    })}
  </div>
) : null}
                    {message.role === "assistant" && message.quickActions && message.quickActions.length ? (
                      <div className="mt-2">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted">Refine Search</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.quickActions.map((action) => (
                            <button
                              key={`${message.id}-${action}`}
                              type="button"
                              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition duration-200 hover:scale-[1.03] hover:border-primary hover:text-primary"
                              onClick={() => void askAi(undefined, action)}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
                {aiLoading ? (
                  <div className="text-left">
                    <div className="inline-block max-w-[92%] rounded-xl border border-border bg-card px-3 py-2.5 shadow-card">
                      <div className="skeleton h-3 w-28 rounded" />
                      <div className="skeleton mt-2 h-3 w-40 rounded" />
                      <div className="skeleton mt-2 h-3 w-24 rounded" />
                    </div>
                    <div className="mt-2 space-y-2">
                      {Array.from({ length: 2 }).map((_, idx) => (
                        <div key={`ai-card-skeleton-${idx}`} className="rounded-xl border border-border bg-card p-2.5">
                          <div className="flex gap-2">
                            <div className="skeleton h-14 w-14 rounded" />
                            <div className="flex-1">
                              <div className="skeleton h-3 w-3/4 rounded" />
                              <div className="skeleton mt-2 h-3 w-1/2 rounded" />
                              <div className="skeleton mt-2 h-3 w-2/3 rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {assistantTyping ? (
                  <div className="text-left">
                    <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted shadow-card">
                      <span className="typing-dots inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-muted" />
                        <span className="h-2 w-2 rounded-full bg-muted" />
                        <span className="h-2 w-2 rounded-full bg-muted" />
                      </span>
                      <span className="text-xs uppercase tracking-wide text-muted">
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <form onSubmit={(event) => void askAi(event)} className="shrink-0 border-t border-border bg-card px-5 py-3">
                <div className="scrollbar-hidden mb-2 flex gap-2 overflow-x-auto whitespace-nowrap">
                  {quickPromptChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="inline-flex rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition duration-200 hover:scale-[1.03] hover:border-primary hover:bg-primary/5 hover:text-primary"
                      onClick={() => void askAi(undefined, chip)}
                      disabled={aiLoading}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <div className={`rounded-2xl border bg-card p-2 shadow-card transition duration-200 ${inputFocused ? "border-primary/70 shadow-[0_0_0_3px_rgba(37,99,235,0.14)]" : "border-border"}`}>
                  <label className={`mb-1 ml-2 block text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 ${inputFocused || question ? "text-primary" : "text-muted-foreground"}`}>
                    Ask Store Assistant
                  </label>
                  <textarea
                    className="min-h-[68px] w-full resize-none rounded-xl border border-border bg-transparent px-3 py-2 text-sm leading-5 text-foreground outline-none"
                    rows={2}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleQuestionKeyDown}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    placeholder="Ask about price, stock, recommendations..."
                  />
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={aiLoading || !question.trim()}
                    type="submit"
                  >
                    <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-active:opacity-100 bg-white/15" />
                    <span className="relative inline-flex items-center gap-2">
                      {aiLoading ? (
                        <>
                          <span className="btn-inline-spinner" />
                          AI is thinking...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </span>
                  </motion.button>
                </div>
              </form>
            </>
          ) : null}
        </motion.div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setCartOpen((prev) => !prev)}
        className="fixed bottom-5 left-5 z-40 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-card"
      >
        Cart ({cartCount})
      </button>

      <div
        className={`fixed bottom-20 left-5 z-40 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 ${
          cartOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-4 opacity-0"
        }`}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Your Cart</p>
          <p className="text-xs text-muted-foreground">{cartCount} item(s)</p>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto bg-card-muted p-3">
          {cartItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cart is empty.</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-2">
                <div className="flex gap-2">
                  <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-md border border-border px-1 py-1">
                      <button className="px-2 text-sm" onClick={() => changeCartQuantity(item.id, -1)} type="button">-</button>
                      <span className="text-xs">{item.quantity}</span>
                      <button className="px-2 text-sm" onClick={() => changeCartQuantity(item.id, 1)} type="button">+</button>
                    </div>
                  </div>
                  <button className="text-xs text-danger-text" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">Subtotal: ${cartSubtotal.toFixed(2)}</p>
          {lowStockAlerts.length ? (
            <p className="mt-1 text-xs text-warning-text">
              {lowStockAlerts.length} item(s) in catalog are low stock.
            </p>
          ) : null}
          <button className="btn-primary mt-2 w-full" disabled={!cartItems.length} onClick={checkout}>
            Checkout (Demo)
          </button>
        </div>
      </div>

      <Modal title="Checkout (Demo)" open={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Order total: <span className="font-semibold text-foreground">${cartSubtotal.toFixed(2)}</span>
          </p>
          <p>This is a demo checkout flow for prototype validation.</p>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={confirmCheckout} type="button">
              Confirm Order
            </button>
            <button className="btn-ghost" onClick={() => setCheckoutOpen(false)} type="button">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
