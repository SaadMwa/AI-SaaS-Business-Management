export interface Customer {
  _id: string;
  customer_number: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface SaleItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Sale {
  _id: string;
  sale_number: string;
  customerId: { _id: string; name: string; email?: string } | string;
  items: SaleItem[];
  total: number;
  status: "draft" | "pending" | "paid" | "cancelled" | "refunded";
  date: string;
  paymentMethod: "card" | "bank_transfer" | "cash" | "paypal" | "other";
  assignedTo?: { _id: string; name: string; email: string } | string;
  createdAt?: string;
}

export interface Task {
  _id: string;
  task_number: number;
  raw_input?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: "todo" | "in_progress" | "blocked" | "done" | "in-progress";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: { _id: string; name: string; email: string } | string;
  relatedToType?: "customer" | "sale";
  relatedToId?: string;
  tags?: string[];
  createdAt?: string;
}

export interface Insight {
  id: string;
  type: "opportunity" | "risk" | "efficiency";
  title: string;
  message: string;
  action: string;
  priority: "low" | "medium" | "high";
}

export interface DashboardMetrics {
  totalRevenue: number;
  currentMonthRevenue: number;
  monthChangePct: number;
  avgDealSize: number;
  totalDeals: number;
  openTasks: number;
  completionRate: number;
  forecastRevenue: number;
  activeCustomers: number;
  salesTrend: { month: string; revenue: number }[];
  lowStockCount: number;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock_quantity: number;
    category: string;
    price: number;
  }>;
  pendingTasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  topSellingProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  customerActivity: {
    activeLast30Days: number;
    returningLast30Days: number;
    totalCustomers: number;
    retentionRate: number;
  };
  predictiveInsights: {
    projected30DaysRevenue: number;
    trendDirection: "up" | "down";
    confidence: number;
  };
  dashboardSummary: string;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  recentSales: Sale[];
  pendingTasks: Task[];
  pendingTaskOverview?: DashboardMetrics["pendingTasksByPriority"];
  lowStockWarnings?: DashboardMetrics["lowStockProducts"];
  insights: Insight[];
}

export interface HistoryEntry {
  _id: string;
  entityType: "task" | "customer" | "sale" | "ai";
  entityId?: number;
  entityNumber?: number;
  actionType?: string;
  action?: string;
  performedBy: string;
  performedById?: string;
  createdAt: string;
  details?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface AiGuide {
  welcome: { title: string; description: string };
  role?: string;
  modes?: Array<{ id: string; label: string; description: string }>;
  overview: string[];
  capabilities: {
    tasks: string[];
    customers: string[];
    sales: string[];
    products?: string[];
    insights: string[];
    history: string[];
  };
  howToTalk: {
    basic: string[];
    tasks: string[];
    customers: string[];
    sales: string[];
    products?: string[];
    history: string[];
  };
  interactiveExamples: string[];
  tips: string[];
}

export interface HistorySettings {
  retentionDays: number | null;
}

export type AiCardType = "task" | "customer" | "sale" | "product";

export interface AiCard {
  type: AiCardType;
  id: string;
  title: string;
  subtitle?: string;
  details: Record<string, unknown>;
}
