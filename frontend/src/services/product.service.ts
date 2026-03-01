import { api } from "./api";

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category?: string;
  is_recommended?: boolean;
  popularity_score?: number;
  top_selling?: boolean;
  store_id: string;
  featured?: boolean;
  low_stock?: boolean;
}

export interface ProductCatalogResponse {
  products: Product[];
  featuredProducts: Product[];
  bestSellers: Product[];
  lowStockAlerts: Product[];
  smartSuggestions: Array<{ id: string; label: string; category: string }>;
  categories: string[];
}

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  category?: string;
  is_recommended?: boolean;
  popularity_score?: number;
  top_selling?: boolean;
};

export const productService = {
  list: async (query?: string) => {
    const { data } = await api.get<{ success: boolean } & ProductCatalogResponse>("/products", {
      params: query ? { q: query } : undefined,
    });
    return data;
  },
  recommendations: async (params?: { q?: string; productId?: string }) => {
    const { data } = await api.get<{
      success: boolean;
      seedProductId: string | null;
      recommendations: Product[];
      featuredProducts: Product[];
      bestSellers: Product[];
      lowStockAlerts: Product[];
      smartSuggestions: Array<{ id: string; label: string; category: string }>;
    }>("/products/recommendations", { params });
    return data;
  },
  create: async (payload: ProductPayload) => {
    const { data } = await api.post<{ success: boolean; product: Product }>("/products", payload);
    return data.product;
  },
  update: async (id: string, payload: ProductPayload) => {
    const { data } = await api.put<{ success: boolean; product: Product }>(`/products/${id}`, payload);
    return data.product;
  },
  remove: async (id: string) => {
    await api.delete(`/products/${id}`);
  },
  generateAiContent: async (params: {
    type: "description" | "caption";
    name: string;
    category?: string;
    price?: number;
    keywords?: string;
    description?: string;
  }) => {
    const { data } = await api.post<{ success: boolean; content: string }>("/products/ai-content", params);
    return data.content;
  },
};
