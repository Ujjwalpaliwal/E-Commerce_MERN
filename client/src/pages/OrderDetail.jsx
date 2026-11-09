import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

const CANCELLABLE = ["pending", "processing"];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get(`/orders/${id}`)
      .then(({ data }) => {
        if (active) setOrder(data.data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? Stock will be restored.")) return;
    setCancelling(true);
    setError("");
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`);
      setOrder(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="container section"><Loader label="Loading order..." /></div>;
  if (error && !order) return <div className="container section"><Alert>{error}</Alert></div>;
  if (!order) return null;

  return (
    <div className="page container section">
      <Link to="/orders" className="link">
        ← Back to orders
      </Link>

      <div className="page-head">
        <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
        <span className={`status status--${order.status}`}>{order.status}</span>
      </div>

      <Alert>{error}</Alert>

      <div className="order-detail-layout">
        <div className="card">
          <h2>Items</h2>
          <div className="order-items">
            {order.items.map((item) => (
              <div key={item.product} className="order-item">
                <div>
                  <strong>{item.name}</strong>
                  <span className="muted">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </span>
                </div>
                <span>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="summary-row summary-row--total">
            <span>Total paid</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <aside className="card">
          <h2>Shipping to</h2>
          <address className="address">
            {order.shippingAddress.street}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.zipCode}
            <br />
            {order.shippingAddress.country}
          </address>

          <h2>Placed</h2>
          <p className="muted">
            {new Date(order.createdAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          {CANCELLABLE.includes(order.status) && (
            <button
              type="button"
              className="btn btn--danger btn--block"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
