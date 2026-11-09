import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";
import { getErrorMessage } from "../api/axios.js";

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div className="page container section">
        <div className="empty-state">
          <h2>Your cart is waiting</h2>
          <p>Log in to view your cart and place orders.</p>
          <div className="empty-state__actions">
            <Link to="/login" className="btn btn--primary">
              Login
            </Link>
            <Link to="/register" className="btn btn--ghost">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return <div className="container section"><Loader label="Loading cart..." /></div>;
  }

  const runAction = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="page container section">
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Browse the catalog and add a few items.</p>
          <Link to="/products" className="btn btn--primary">
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page container section">
      <div className="page-head">
        <h1>Your cart</h1>
        <button type="button" className="btn btn--ghost" onClick={() => runAction("clear", clearCart)}>
          Clear cart
        </button>
      </div>

      <Alert>{error}</Alert>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item__media">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div className="product-card__placeholder">{item.name.charAt(0)}</div>
                )}
              </div>

              <div className="cart-item__info">
                <Link to={`/products/${item.productId}`} className="cart-item__title">
                  {item.name}
                </Link>
                <span className="muted">${item.price.toFixed(2)} each</span>
              </div>

              <div className="qty qty--sm">
                <button
                  type="button"
                  disabled={busyId === item.productId || item.quantity <= 1}
                  onClick={() =>
                    runAction(item.productId, () => updateItem(item.productId, item.quantity - 1))
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={busyId === item.productId || item.quantity >= item.stock}
                  onClick={() =>
                    runAction(item.productId, () => updateItem(item.productId, item.quantity + 1))
                  }
                >
                  +
                </button>
              </div>

              <span className="cart-item__subtotal">${item.subtotal.toFixed(2)}</span>

              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${item.name}`}
                disabled={busyId === item.productId}
                onClick={() => runAction(item.productId, () => removeItem(item.productId))}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Summary</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{cart.totalItems}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{cart.total >= 75 ? "Free" : "$7.99 at checkout"}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          <Link to="/checkout" className="btn btn--primary btn--block">
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
