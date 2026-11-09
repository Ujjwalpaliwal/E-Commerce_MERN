import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand">
          Shoply<span className="brand__dot">.</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/products">Products</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="cart-link" aria-label="Cart">
            Cart
            {cart.totalItems > 0 && <span className="badge">{cart.totalItems}</span>}
          </Link>

          {user ? (
            <div className="user-menu">
              <span className="user-name">Hi, {user.name.split(" ")[0]}</span>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn btn--ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn--primary">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
