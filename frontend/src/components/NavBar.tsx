import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function NavBar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear JWT and return to login.
    logout();
    navigate("/login");
  };

  return (
    <header className="nav">
      <div className="nav__brand">Business SaaS</div>
      <nav className="nav__links">
        {token ? (
          <>
            <span className="nav__user">{user?.email}</span>
            <button className="btn btn--ghost" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="link">
              Login
            </Link>
            <Link to="/store" className="link">
              Shop
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
