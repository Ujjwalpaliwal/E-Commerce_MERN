import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const REQUIRED_ADDRESS_FIELDS = ["street", "city", "state", "zipCode", "country"];

export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress } = req.body;

  if (
    !shippingAddress ||
    typeof shippingAddress !== "object" ||
    REQUIRED_ADDRESS_FIELDS.some((field) => !shippingAddress[field])
  ) {
    res.status(400);
    throw new Error(
      `shippingAddress must include: ${REQUIRED_ADDRESS_FIELDS.join(", ")}`
    );
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product"
  );

  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  const orderItems = [];
  const quantityByProduct = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product) {
      res.status(404);
      throw new Error("A product in your cart no longer exists");
    }

    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(
        `Insufficient stock for ${product.name}. Available: ${product.stock}`
      );
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      subtotal: round2(product.price * item.quantity),
    });
    quantityByProduct.push({ product, quantity: item.quantity });
  }

  const totalAmount = round2(
    orderItems.reduce((sum, item) => sum + item.subtotal, 0)
  );

  const decremented = [];

  try {
    for (const { product, quantity } of quantityByProduct) {
      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true }
      );

      if (!updated) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`
        );
      }
      decremented.push({ productId: product._id, quantity });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        zipCode: shippingAddress.zipCode,
        country: shippingAddress.country,
      },
      status: "pending",
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    for (const { productId, quantity } of decremented) {
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: quantity } }
      );
    }
    res.status(400);
    throw error;
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.status(200).json({ success: true, count: orders.length, data: orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.status(200).json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (order.status === "cancelled") {
    res.status(400);
    throw new Error("Order is already cancelled");
  }

  if (order.status === "delivered") {
    res.status(400);
    throw new Error("Cannot cancel a delivered order");
  }

  for (const item of order.items) {
    await Product.updateOne(
      { _id: item.product },
      { $inc: { stock: item.quantity } }
    );
  }

  order.status = "cancelled";
  await order.save();

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: order,
  });
});

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
