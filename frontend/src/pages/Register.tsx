import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Registration Disabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This demo is admin-only. Use the seeded admin account to sign in or browse the public store.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/login" className="btn-primary">Admin Login</Link>
          <Link to="/store" className="btn-ghost">Go to Shop</Link>
        </div>
      </div>
    </div>
  );
}
