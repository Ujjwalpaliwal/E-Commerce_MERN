import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  nameAsc: { name: 1 },
  ratingDesc: { rating: -1 },
};

export const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    sort = "newest",
    page = "1",
    limit = "12",
  } = req.query;

  const filter = {};

  if (category) {
    filter.category = { $regex: `^${escapeRegex(category)}$`, $options: "i" };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: escapeRegex(search), $options: "i" } },
      { description: { $regex: escapeRegex(search), $options: "i" } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== "") {
      filter.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      filter.price.$lte = Number(maxPrice);
    }
  }

  if (inStock === "true") {
    filter.stock = { $gt: 0 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
  const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortBy)
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / pageSize),
    data: products,
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({ success: true, data: product });
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct("category");
  res.status(200).json({ success: true, data: categories.sort() });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, stock, category, imageUrl } = req.body;

  if (!name || !description || price === undefined || !category) {
    res.status(400);
    throw new Error("Name, description, price and category are required");
  }

  const product = await Product.create({
    name,
    description,
    price,
    stock: stock ?? 0,
    category,
    imageUrl: imageUrl ?? "",
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    data: { _id: product._id },
  });
});

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
