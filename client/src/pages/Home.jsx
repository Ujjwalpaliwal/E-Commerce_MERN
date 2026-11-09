import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/products", { params: { limit: 8, sort: "ratingDesc", inStock: "true" } }),
      api.get("/products/categories"),
    ])
      .then(([productsRes, categoriesRes]) => {
        if (!active) return;
        setProducts(productsRes.data.data);
        setCategories(categoriesRes.data.data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load storefront");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="eyebrow">New season · 2026</span>
            <h1>Gear that keeps up with your day.</h1>
            <p>
              Hand-picked electronics, accessories and everyday essentials.
              Free shipping on orders over $75.
            </p>
            <div className="hero__actions">
              <Link to="/products" className="btn btn--primary btn--lg">
                Shop all products
              </Link>
              <Link to="/products?sort=priceAsc" className="btn btn--ghost btn--lg">
                Browse deals
              </Link>
            </div>
          </div>
          <div className="hero__stats">
            <div>
              <strong>12+</strong>
              <span>Products</span>
            </div>
            <div>
              <strong>4.6★</strong>
              <span>Avg. rating</span>
            </div>
            <div>
              <strong>24h</strong>
              <span>Dispatch</span>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Shop by category</h2>
        </div>
        <div className="chips">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/products?category=${encodeURIComponent(category)}`}
              className="chip"
            >
              {category}
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Top rated</h2>
          <Link to="/products" className="link">
            View all →
          </Link>
        </div>

        {loading && <Loader label="Loading products..." />}
        <Alert>{error}</Alert>

        {!loading && !error && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
