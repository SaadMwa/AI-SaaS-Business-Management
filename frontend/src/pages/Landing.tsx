import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface-raised">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-16 pt-12">
        <header className="rounded-3xl border border-border bg-card p-8 shadow-soft">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">Business AI Platform</p>
          <h1 className="mt-3 text-5xl font-semibold text-foreground">
            Run Sales, Tasks, and Store Ops With One AI Brain
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            Premium SaaS command center with admin automation, customer-facing AI storefront, and strategic
            dashboards.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/login">
              Start Admin Demo
            </Link>
            <Link className="btn-ghost" to="/store">
              Visit Storefront
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="card p-6">
            <h2 className="text-lg font-semibold text-foreground">AI Business Advisor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Action + strategy mode with KPI commentary and proactive recommendations.
            </p>
          </article>
          <article className="card p-6">
            <h2 className="text-lg font-semibold text-foreground">Smart Store Assistant</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Human-style responses with product availability, price precision, and related suggestions.
            </p>
          </article>
          <article className="card p-6">
            <h2 className="text-lg font-semibold text-foreground">Operator Dashboard</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Revenue trends, top sellers, low-stock alerts, predictive insights, and action simulation.
            </p>
          </article>
        </section>

        <section className="card p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-muted">AI Showcase</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Ask: "What should I improve this week?"
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            The platform analyzes operations, revenue trend, and inventory risk to provide concrete next steps.
          </p>
        </section>
      </section>
    </div>
  );
}
