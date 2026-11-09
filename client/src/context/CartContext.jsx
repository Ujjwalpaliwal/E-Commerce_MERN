import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const EMPTY_CART = { items: [], total: 0, totalItems: 0 };

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART);
      return EMPTY_CART;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/cart");
      setCart(data.data);
      return data.data;
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCart(EMPTY_CART);
      return;
    }
    refresh().catch(() => setCart(EMPTY_CART));
  }, [user, refresh]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    const { data } = await api.post("/cart", { productId, quantity });
    setCart(data.data);
    return data.data;
  }, []);

  const updateItem = useCallback(async (productId, quantity) => {
    const { data } = await api.put(`/cart/${productId}`, { quantity });
    setCart(data.data);
    return data.data;
  }, []);

  const removeItem = useCallback(async (productId) => {
    const { data } = await api.delete(`/cart/${productId}`);
    setCart(data.data);
    return data.data;
  }, []);

  const clearCart = useCallback(async () => {
    const { data } = await api.delete("/cart");
    setCart(data.data);
    return data.data;
  }, []);

  const value = useMemo(
    () => ({ cart, loading, refresh, addToCart, updateItem, removeItem, clearCart }),
    [cart, loading, refresh, addToCart, updateItem, removeItem, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
