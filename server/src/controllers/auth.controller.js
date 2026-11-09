import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(409);
    throw new Error("Email already registered");
  }

  const user = await User.create({ name, email, password });
  await Cart.create({ user: user._id, items: [] });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      user: user.toSafeJSON(),
      token: generateToken(user._id),
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "+password"
  );

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: user.toSafeJSON(),
      token: generateToken(user._id),
    },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: { user: req.user.toSafeJSON() },
  });
});
