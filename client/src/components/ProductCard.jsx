import { Link } from "react-router-dom";

export default function ProductCard({ product }) {
  const inStock = product.stock > 0;

  return (
    <article className="product-card">
      <Link to={`/products/${product._id}`} className="product-card__media">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card__placeholder">{product.name.charAt(0)}</div>
        )}
        {!inStock && <span className="pill pill--danger">Out of stock</span>}
        {inStock && product.stock <= 5 && (
          <span className="pill pill--warning">Only {product.stock} left</span>
        )}
      </Link>

      <div className="product-card__body">
        <span className="product-card__category">{product.category}</span>
        <h3 className="product-card__title">
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>
        <div className="product-card__meta">
          <span className="price">${product.price.toFixed(2)}</span>
          <span className="rating">★ {product.rating ? product.rating.toFixed(1) : "—"}</span>
        </div>
      </div>
    </article>
  );
}
