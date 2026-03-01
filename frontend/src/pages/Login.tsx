import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/theme.context";

export default function Login() {
  const { login, error } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hasError = Boolean(formError || error);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.includes("@")) {
      setFormError("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);
    if (ok) navigate("/dashboard");
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb -left-24 top-10 h-64 w-64" />
      <div className="auth-orb auth-orb-secondary -right-20 top-1/4 h-72 w-72" />
      <div className="auth-orb bottom-6 left-1/3 h-80 w-80 opacity-40" />

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-2">
        <div className="auth-card animate-rise">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-xl font-semibold text-primary">
              BA
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted">Business AI</p>
              <h1 className="text-3xl font-semibold text-foreground">Premium Operations Suite</h1>
            </div>
            </div>
            <button className="btn-ghost" onClick={toggleTheme} type="button">
              {theme === "system" ? `System (${resolvedTheme})` : `${theme} mode`}
            </button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Bring your store, sales, and customer workflows into one AI-powered command center. Built for fast decisions,
            clean reporting, and guided automation.
          </p>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                1
              </span>
              <span>Automated task orchestration with real-time alerts and audit trails.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary/15 text-xs font-semibold text-foreground">
                2
              </span>
              <span>Unified intelligence across inventory, sales, and customer behavior.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-card-muted text-xs font-semibold text-foreground">
                3
              </span>
              <span>Premium dashboards with AI copilots for faster decision cycles.</span>
            </li>
          </ul>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Real-time</p>
              <p className="mt-2 text-lg font-semibold text-foreground">Insights + Alerts</p>
              <p className="mt-1 text-xs text-muted-foreground">AI highlights critical changes in minutes.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card-muted p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Unified</p>
              <p className="mt-2 text-lg font-semibold text-foreground">Storefront + Admin</p>
              <p className="mt-1 text-xs text-muted-foreground">One identity, one data plane.</p>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs text-muted">
            <span className="badge badge-info">SOC-ready</span>
            <span className="badge badge-neutral">Granular roles</span>
            <span className="badge badge-neutral">Usage analytics</span>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <Link className="btn-primary w-fit" to="/store">
              Explore Storefront
            </Link>
            <span className="text-xs text-muted-foreground">Customer view stays isolated.</span>
          </div>
        </div>

        <div className="auth-card animate-fade-in">
          <p className="text-xs uppercase tracking-[0.3em] text-muted">Admin Portal</p>
          <h2 className="mt-2 text-3xl font-semibold text-foreground">Sign in to continue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the seeded admin account to manage products, sales, customers, tasks, and AI insights.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="relative">
              <input
                className={`auth-input peer ${hasError ? "border-danger-border focus:ring-danger-border/30" : ""}`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                autoComplete="email"
                aria-invalid={hasError}
              />
              <label className="auth-label peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary">
                Admin email
              </label>
              <p className="mt-1 text-xs text-muted-foreground">Example: `admin@demo-store.com`</p>
            </div>
            <div className="relative">
              <input
                className={`auth-input peer ${hasError ? "border-danger-border focus:ring-danger-border/30" : ""}`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                autoComplete="current-password"
                aria-invalid={hasError}
              />
              <label className="auth-label peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-muted peer-focus:top-3 peer-focus:text-xs peer-focus:text-primary">
                Password
              </label>
            </div>

            {formError ? (
              <div className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {formError}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger-text">
                {error}
              </div>
            ) : null}

            <button className="btn-primary w-full" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="btn-inline-spinner" />
                  Signing in...
                </>
              ) : (
                "Login"
              )}
            </button>
            <p className="text-xs text-muted-foreground">Press Enter to sign in.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
