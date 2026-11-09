import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import { useCart } from "../context/CartContext.jsx";
import Alert from "../components/Alert.jsx";

const INITIAL_ADDRESS = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "India",
};

export default function Checkout() {
  const { cart, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState(INITIAL_ADDRESS);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { data } = await api.post("/orders", { shippingAddress: address });
      await refresh();
      navigate(`/orders/${data.data._id}`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="page container section">
        <div className="empty-state">
          <h2>Nothing to check out</h2>
          <p>Add items to your cart before placing an order.</p>
          <Link to="/products" className="btn btn--primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page container section">
      <div className="page-head">
        <h1>Checkout</h1>
      </div>

      <Alert>{error}</Alert>

      <div className="checkout-layout">
        <form className="card" onSubmit={handleSubmit}>
          <h2>Shipping address</h2>

          <label className="field">
            <span>Street</span>
            <input name="street" value={address.street} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>City</span>
            <input name="city" value={address.city} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>State</span>
            <input name="state" value={address.state} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>ZIP / Postal code</span>
            <input name="zipCode" value={address.zipCode} onChange={handleChange} required />
          </label>
          <label className="field">
            <span>Country</span>
            <input name="country" value={address.country} onChange={handleChange} required />
          </label>

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
            {submitting ? "Placing order..." : `Place order · $${cart.total.toFixed(2)}`}
          </button>
        </form>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          {cart.items.map((item) => (
            <div key={item.productId} className="summary-row">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>${item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-row summary-row--total">
            <span>Total</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
