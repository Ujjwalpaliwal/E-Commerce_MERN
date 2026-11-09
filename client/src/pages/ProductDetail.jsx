import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        if (active) setProduct(data.data);
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

  if (loading) return <div className="container section"><Loader label="Loading product..." /></div>;
  if (error) return <div className="container section"><Alert>{error}</Alert></div>;
  if (!product) return null;

  const outOfStock = product.stock <= 0;

  const handleAdd = async () => {
    if (!user) {
      navigate("/login", { state: { from: `/products/${id}` } });
      return;
    }

    setAdding(true);
    setError("");
    setNotice("");
    try {
      await addToCart(product._id, quantity);
      setNotice("Added to cart.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="page container section">
      <Link to="/products" className="link">
        ← Back to products
      </Link>

      <div className="product-detail">
        <div className="product-detail__media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="product-card__placeholder">{product.name.charAt(0)}</div>
          )}
        </div>

        <div className="product-detail__info">
          <span className="product-card__category">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="product-detail__meta">
            <span className="price price--lg">${product.price.toFixed(2)}</span>
            <span className="rating">★ {product.rating ? product.rating.toFixed(1) : "—"} ({product.numReviews} reviews)</span>
          </div>

          <p className="product-detail__description">{product.description}</p>

          <p className={outOfStock ? "stock stock--out" : "stock"}>
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </p>

          <Alert>{error}</Alert>
          {notice && <Alert type="success">{notice}</Alert>}

          <div className="buy-row">
            <div className="qty">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={outOfStock}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(event) =>
                  setQuantity(Math.max(1, Math.min(product.stock, Number(event.target.value) || 1)))
                }
                disabled={outOfStock}
              />
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                disabled={outOfStock}
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="btn btn--primary btn--lg"
              onClick={handleAdd}
              disabled={outOfStock || adding}
            >
              {adding ? "Adding..." : outOfStock ? "Out of stock" : "Add to cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
