import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/orders")
      .then(({ data }) => {
        if (active) setOrders(data.data);
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
  }, []);

  if (loading) return <div className="container section"><Loader label="Loading orders..." /></div>;

  return (
    <div className="page container section">
      <div className="page-head">
        <h1>Your orders</h1>
        <span className="muted">{orders.length} total</span>
      </div>

      <Alert>{error}</Alert>

      {orders.length === 0 && !error ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Place your first order to see it here.</p>
          <Link to="/products" className="btn btn--primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <Link to={`/orders/${order._id}`} key={order._id} className="order-row">
              <div>
                <span className="order-row__id">#{order._id.slice(-6).toUpperCase()}</span>
                <span className="muted">
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="muted">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
              </div>
              <span className={`status status--${order.status}`}>{order.status}</span>
              <strong>${order.totalAmount.toFixed(2)}</strong>
              <span className="link">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
