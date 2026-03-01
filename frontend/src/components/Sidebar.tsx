import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "Products" },
  { to: "/customers", label: "Customers" },
  { to: "/sales", label: "Sales" },
  { to: "/tasks", label: "Tasks" },
  { to: "/ai", label: "Ask AI" },
  { to: "/history", label: "History" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-card border-r border-border min-h-screen px-6 py-8">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">SH AI</div>
        <div className="text-2xl font-semibold">Business SaaS</div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-4 py-3 rounded-xl font-semibold transition ${
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-muted hover:bg-card-muted"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-10 rounded-xl border border-border p-4 bg-card-muted">
        <div className="text-xs text-muted">Signed in</div>
        <div className="text-sm font-semibold text-foreground truncate">{user?.email}</div>
        <button className="btn-ghost mt-4 w-full" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
