import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import FloatingAiWidget from "./FloatingAiWidget";
import Toast from "./Toast";
import PageTransition from "./PageTransition";
import { useToast } from "../hooks/useToast";
import { historyService } from "../services/history.service";
import { api } from "../services/api";
import { useTheme } from "../context/theme.context";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/customers": "Customers",
  "/sales": "Sales",
  "/tasks": "Tasks",
  "/ai": "Ask AI",
  "/history": "History",
};

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/customers", label: "Customers" },
  { to: "/sales", label: "Sales" },
  { to: "/tasks", label: "Tasks" },
  { to: "/ai", label: "Ask AI" },
  { to: "/history", label: "History" },
];

export default function AppLayout() {
  const location = useLocation();
  const title = titles[location.pathname] || "Dashboard";
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const [activityCount, setActivityCount] = useState(0);
  const [health, setHealth] = useState<{ ai: "ok" | "degraded"; db: "ok" | "degraded" } | null>(
    null
  );
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const refresh = async () => {
      try {
        const count = await historyService.getCount(1);
        setActivityCount(count);
      } catch {
        setActivityCount(0);
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data } = await api.get<{
          success: boolean;
          status?: { ai?: "ok" | "degraded"; db?: "ok" | "degraded" };
        }>("/status");
        if (data?.status) {
          setHealth({
            ai: data.status.ai || "degraded",
            db: data.status.db || "degraded",
          });
        }
      } catch {
        setHealth({ ai: "degraded", db: "degraded" });
      }
    };
    void checkHealth();
    const timer = window.setInterval(() => void checkHealth(), 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const custom = event as CustomEvent<{ type: "info" | "success" | "error"; message: string }>;
      if (!custom.detail?.message) return;
      showToast(custom.detail.message, custom.detail.type || "error");
    };
    window.addEventListener("app:toast", handleToast as EventListener);
    return () => window.removeEventListener("app:toast", handleToast as EventListener);
  }, [showToast]);

  return (
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          title={title}
          theme={theme}
          resolvedTheme={resolvedTheme}
          onToggleTheme={toggleTheme}
          activityCount={activityCount}
          health={health}
        />
        
        {/* Mobile Navigation */}
        <div className="lg:hidden bg-card border-b border-border px-4 py-2">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium flex-shrink-0 ${
                    isActive 
                      ? "bg-primary text-white" 
                      : "bg-card-muted text-muted-foreground hover:bg-surface-muted"
                  }`
                }
                end={item.to === "/dashboard"}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* Main Content */}
        <main className="min-h-[calc(100vh-4rem)] bg-surface-raised px-4 pb-12 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
      <FloatingAiWidget />
      {toast ? <Toast message={toast.message} type={toast.type} onClose={hideToast} /> : null}
    </div>
  );
}
