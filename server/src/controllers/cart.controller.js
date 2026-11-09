import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

function serializeCart(cart) {
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      imageUrl: item.product.imageUrl,
      stock: item.product.stock,
      quantity: item.quantity,
      subtotal: round2(item.product.price * item.quantity),
    }));

  const total = round2(items.reduce((sum, item) => sum + item.subtotal, 0));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    user: cart.user,
    items,
    total,
    totalItems,
  };
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate("items.product");

  res.status(200).json({ success: true, data: serializeCart(cart) });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("productId is required");
  }

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    res.status(400);
    throw new Error("quantity must be a positive integer");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const cart = await getOrCreateCart(req.user._id);
  const existing = cart.items.find(
    (item) => item.product.toString() === productId
  );
  const effectiveQty = (existing ? existing.quantity : 0) + qty;

  if (product.stock < effectiveQty) {
    res.status(400);
    throw new Error(
      `Insufficient stock for ${product.name}. Available: ${product.stock}`
    );
  }

  if (existing) {
    existing.quantity = effectiveQty;
  } else {
    cart.items.push({ product: product._id, quantity: qty });
  }

  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    success: true,
    message: "Item added to cart",
    data: serializeCart(cart),
  });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const qty = Number(req.body.quantity);

  if (!Number.isInteger(qty) || qty < 0) {
    res.status(400);
    throw new Error("quantity must be a non-negative integer");
  }

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.find((i) => i.product.toString() === productId);

  if (!item) {
    res.status(404);
    throw new Error("Item not in cart");
  }

  if (qty === 0) {
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
  } else {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    if (product.stock < qty) {
      res.status(400);
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock}`
      );
    }
    item.quantity = qty;
  }

  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    success: true,
    message: "Cart updated",
    data: serializeCart(cart),
  });
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const cart = await getOrCreateCart(req.user._id);

  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);

  if (cart.items.length === before) {
    res.status(404);
    throw new Error("Item not in cart");
  }

  await cart.save();
  await cart.populate("items.product");

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    data: serializeCart(cart),
  });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart cleared",
    data: serializeCart(cart),
  });
});

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
