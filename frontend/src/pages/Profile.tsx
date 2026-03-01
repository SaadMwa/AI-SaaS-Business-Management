import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-foreground">Account</h2>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <div>
          <span className="font-semibold text-muted-foreground">Name:</span> {user.name}
        </div>
        <div>
          <span className="font-semibold text-muted-foreground">Email:</span> {user.email}
        </div>
        <div>
          <span className="font-semibold text-muted-foreground">Role:</span> {user.role}
        </div>
      </div>
    </div>
  );
}
