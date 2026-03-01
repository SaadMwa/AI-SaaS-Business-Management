import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import InsightCard from "../components/InsightCard";
import StatCard from "../components/StatCard";
import AiChat from "../components/AiChat";
import { dashboardService } from "../services/dashboard.service";
import { DashboardResponse } from "../types";
import { logger } from "../utils/logger";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);

const taskPriorityColors = ["#2563eb", "#14b8a6", "#f59e0b", "#ef4444"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceImpactPct, setPriceImpactPct] = useState(10);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await dashboardService.getDashboard();
        setData(result);
      } catch (error) {
        logger.error("dashboard_load_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={`stat-skeleton-${idx}`} className="card p-5">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton mt-4 h-8 w-32 rounded" />
              <div className="skeleton mt-4 h-3 w-24 rounded" />
            </div>
          ))}
        </section>
        <div className="card p-6">
          <div className="skeleton h-4 w-40 rounded" />
          <div className="skeleton mt-6 h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="card p-6">No data available.</div>;
  }

  const { metrics, recentSales, pendingTasks, insights } = data;
  const priorityChartData = [
    { name: "Low", value: metrics.pendingTasksByPriority?.low || 0 },
    { name: "Medium", value: metrics.pendingTasksByPriority?.medium || 0 },
    { name: "High", value: metrics.pendingTasksByPriority?.high || 0 },
    { name: "Urgent", value: metrics.pendingTasksByPriority?.urgent || 0 },
  ];

  const baseRevenue = metrics.currentMonthRevenue || 0;
  const simulatedRevenue = baseRevenue * (1 + priceImpactPct / 100);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Revenue" numericValue={metrics.totalRevenue} formatter={formatCurrency} />
        <StatCard
          title="Revenue This Month"
          numericValue={metrics.currentMonthRevenue}
          formatter={formatCurrency}
          delta={`${metrics.monthChangePct.toFixed(1)}%`}
          helper="vs last month"
        />
        <StatCard title="Forecast (30d)" numericValue={metrics.forecastRevenue} formatter={formatCurrency} />
        <StatCard title="Open Tasks" numericValue={metrics.openTasks} />
        <StatCard title="Low Stock Alerts" numericValue={metrics.lowStockCount || 0} />
        <StatCard title="Active Customers (30d)" numericValue={metrics.customerActivity?.activeLast30Days || 0} />
        <StatCard
          title="Returning Customers"
          numericValue={metrics.customerActivity?.returningLast30Days || 0}
        />
        <StatCard
          title="Retention Rate"
          value={`${(metrics.customerActivity?.retentionRate || 0).toFixed(1)}%`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-ink">Revenue Trend</h3>
              <p className="text-sm text-ink-muted">Last 6 months performance</p>
            </div>
            <div className="chip chip-info">AI monitored</div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-card-muted p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">AI Dashboard Summary</p>
            <p className="mt-2 text-sm text-ink-muted">{metrics.dashboardSummary}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-ink">Task Priority Distribution</h3>
            <div className="mt-4 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityChartData} dataKey="value" nameKey="name" outerRadius={72} label>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={taskPriorityColors[index % taskPriorityColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card card-ai p-6">
            <h3 className="text-lg font-semibold text-ai-text">AI Insights</h3>
            <div className="mt-4 space-y-3">
              {(insights || []).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-ink">Top 5 Selling Products (30d)</h3>
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topSellingProducts || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="quantity" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-ink">Price Impact Simulator</h3>
          <p className="mt-2 text-sm text-ink-muted">
            Simulate projected revenue if prices increase.
          </p>
          <div className="mt-4 space-y-3">
            <label className="text-sm text-ink-muted">
              Increase (%)
              <input
                type="range"
                min={1}
                max={30}
                value={priceImpactPct}
                onChange={(e) => setPriceImpactPct(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <div className="rounded-xl border border-border bg-card-muted p-4">
              <p className="text-sm text-ink-muted">Scenario: +{priceImpactPct}% pricing</p>
              <p className="mt-1 text-xl font-semibold text-ink">{formatCurrency(simulatedRevenue)}</p>
              <p className="text-xs text-ink-muted">
                Predictive trend: {metrics.predictiveInsights?.trendDirection || "stable"} | Confidence{" "}
                {metrics.predictiveInsights?.confidence || 0}%
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-ink">Recent Sales</h3>
          <div className="mt-4 space-y-3">
            {(recentSales || []).map((sale) => (
              <div
                key={sale._id}
                className="lift-hover flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <div className="text-sm font-semibold text-ink-subtle">
                    {typeof sale.customerId === "string" ? "Customer" : sale.customerId?.name || "Unknown Customer"}
                  </div>
                  <div className="text-xs text-ink-muted">{sale.status ? sale.status.toUpperCase() : "UNKNOWN"}</div>
                </div>
                <div className="text-sm font-semibold text-ink">{formatCurrency(sale.total)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-ink">Pending Tasks</h3>
          <div className="mt-4 space-y-3">
            {(pendingTasks || []).map((task) => (
              <div key={task._id} className="flex items-center justify-between rounded-lg p-1 transition-colors hover:bg-card-muted">
                <div>
                  <div className="text-sm font-semibold text-ink-subtle">{task.title}</div>
                  <div className="text-xs text-ink-muted">{task.status.replace("-", " ").replace("_", " ")}</div>
                </div>
                <span className={`chip chip-warning ${task.priority === "urgent" ? "pulse-alert" : ""}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-lg font-semibold text-ink">Admin AI Chat</h3>
        <p className="text-sm text-ink-muted">Ask for execution help or strategic recommendations.</p>
        <div className="mt-4">
          <AiChat />
        </div>
      </section>
    </div>
  );
}
