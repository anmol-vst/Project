import { Link } from "react-router-dom";
import { useAuth } from "../state/auth";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="nav">
      <Link to="/" className="brand-link">
        <div className="brand-mark" aria-hidden />
        <div className="brand">Fairway &amp; Foundation</div>
      </Link>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/charities">Charities</Link>
        <Link to="/pricing">Pricing</Link>
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link className="btn nav-cta" to="/signup">
              Sign up
            </Link>
          </>
        ) : (
          <button className="btn ghost nav-logout" type="button" onClick={logout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}
