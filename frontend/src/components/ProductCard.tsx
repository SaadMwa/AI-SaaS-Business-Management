import { motion } from "framer-motion";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    stock_label: string;
    stock_quantity: number;
    key_feature?: string;
    match_reason?: string;
  };
  onAddToCart: () => void;
};

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="lift-hover rounded-xl border border-border bg-card p-2.5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex min-w-0 gap-2">
        <img src={product.image_url} alt={product.name} className="h-14 w-14 rounded object-cover" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            ${product.price.toFixed(2)} | {product.stock_label}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {product.top_selling ? <span className="badge badge-success">Top Seller</span> : null}
            {product.is_recommended ? <span className="badge badge-info">Recommended</span> : null}
          </div>
          {product.key_feature ? (
            <p className="mt-1 text-xs text-muted-foreground">Key: {product.key_feature}</p>
          ) : null}
          {product.match_reason ? (
            <p className="mt-1 text-[11px] text-muted">{product.match_reason}</p>
          ) : null}
          <button
            className="mt-1 rounded-md border border-border px-2 py-1 text-xs hover:border-primary hover:text-primary"
            onClick={onAddToCart}
            disabled={product.stock_quantity <= 0}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}
