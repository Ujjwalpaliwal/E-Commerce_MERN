import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";
import Alert from "../components/Alert.jsx";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
  { value: "ratingDesc", label: "Top rated" },
  { value: "nameAsc", label: "Name A-Z" },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const inStock = searchParams.get("inStock") || "";
  const page = Number(searchParams.get("page") || 1);

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    api
      .get("/products/categories")
      .then(({ data }) => setCategories(data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    api
      .get("/products", {
        params: {
          search: search || undefined,
          category: category || undefined,
          sort,
          inStock: inStock || undefined,
          page,
          limit: 12,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setProducts(data.data);
        setMeta({ total: data.total, page: data.page, pages: data.pages });
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load products");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, category, sort, inStock, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setSearchParams(next);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParam("search", searchInput.trim());
  };

  const handlePage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page container section">
      <div className="page-head">
        <h1>All products</h1>
        <span className="muted">{meta.total} items</span>
      </div>

      <div className="filters">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </form>

        <select value={category} onChange={(event) => updateParam("category", event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(event) => updateParam("sort", event.target.value)}>
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="checkbox">
          <input
            type="checkbox"
            checked={inStock === "true"}
            onChange={(event) => updateParam("inStock", event.target.checked ? "true" : "")}
          />
          In stock only
        </label>
      </div>

      {loading && <Loader label="Loading products..." />}
      <Alert>{error}</Alert>

      {!loading && !error && products.length === 0 && (
        <div className="empty-state">No products matched your filters.</div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {meta.pages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={meta.page <= 1}
                onClick={() => handlePage(meta.page - 1)}
              >
                Prev
              </button>
              <span>
                Page {meta.page} of {meta.pages}
              </span>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={meta.page >= meta.pages}
                onClick={() => handlePage(meta.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
