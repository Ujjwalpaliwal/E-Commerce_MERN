import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Cart from "../models/Cart.js";

const products = [
  {
    name: "Aurora Pro 15 Laptop",
    description:
      "High performance laptop with 16GB RAM, 512GB SSD and a 15-inch retina display.",
    price: 1299.99,
    stock: 25,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/laptop-pro/600/400",
    rating: 4.6,
    numReviews: 128,
  },
  {
    name: "Nimbus Wireless Headphones",
    description:
      "Over-ear noise cancelling headphones with 30-hour battery life.",
    price: 199.99,
    stock: 60,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/headphones/600/400",
    rating: 4.4,
    numReviews: 89,
  },
  {
    name: "Pulse Smart Watch",
    description:
      "Fitness smart watch with heart-rate tracking, GPS and AMOLED display.",
    price: 149.5,
    stock: 80,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/smartwatch/600/400",
    rating: 4.2,
    numReviews: 54,
  },
  {
    name: "Zephyr Mechanical Keyboard",
    description:
      "Compact 75% mechanical keyboard with hot-swappable switches and RGB.",
    price: 89.99,
    stock: 120,
    category: "Accessories",
    imageUrl: "https://picsum.photos/seed/keyboard/600/400",
    rating: 4.7,
    numReviews: 210,
  },
  {
    name: "Glide Ergonomic Mouse",
    description:
      "Wireless ergonomic mouse with silent clicks and USB-C charging.",
    price: 39.99,
    stock: 150,
    category: "Accessories",
    imageUrl: "https://picsum.photos/seed/mouse/600/400",
    rating: 4.1,
    numReviews: 76,
  },
  {
    name: "Orbit 4K Monitor",
    description:
      "27-inch 4K UHD monitor with HDR support and USB-C hub built in.",
    price: 449.0,
    stock: 18,
    category: "Electronics",
    imageUrl: "https://picsum.photos/seed/monitor/600/400",
    rating: 4.5,
    numReviews: 41,
  },
  {
    name: "Trailhead Backpack 30L",
    description:
      "Water-resistant hiking backpack with laptop sleeve and ventilated back.",
    price: 79.0,
    stock: 95,
    category: "Outdoor",
    imageUrl: "https://picsum.photos/seed/backpack/600/400",
    rating: 4.3,
    numReviews: 63,
  },
  {
    name: "Hydro Steel Bottle",
    description:
      "Insulated stainless steel bottle keeps drinks cold for 24 hours.",
    price: 24.99,
    stock: 200,
    category: "Outdoor",
    imageUrl: "https://picsum.photos/seed/bottle/600/400",
    rating: 4.0,
    numReviews: 33,
  },
  {
    name: "Lumen Desk Lamp",
    description:
      "LED desk lamp with adjustable brightness, colour temperature and USB port.",
    price: 54.99,
    stock: 70,
    category: "Home",
    imageUrl: "https://picsum.photos/seed/lamp/600/400",
    rating: 4.4,
    numReviews: 52,
  },
  {
    name: "Drift Cotton Hoodie",
    description:
      "Heavyweight organic cotton hoodie with a relaxed fit and drop shoulders.",
    price: 64.0,
    stock: 140,
    category: "Clothing",
    imageUrl: "https://picsum.photos/seed/hoodie/600/400",
    rating: 4.6,
    numReviews: 118,
  },
  {
    name: "Stride Running Shoes",
    description:
      "Lightweight running shoes with responsive foam and breathable mesh upper.",
    price: 119.99,
    stock: 85,
    category: "Clothing",
    imageUrl: "https://picsum.photos/seed/shoes/600/400",
    rating: 4.5,
    numReviews: 97,
  },
  {
    name: "Brew Pour-Over Kit",
    description:
      "Complete pour-over coffee kit with glass carafe, dripper and paper filters.",
    price: 34.5,
    stock: 4,
    category: "Home",
    imageUrl: "https://picsum.photos/seed/coffee/600/400",
    rating: 4.2,
    numReviews: 28,
  },
];

async function seed() {
  try {
    await connectDB();

    await Product.deleteMany({});
    const inserted = await Product.insertMany(products);
    console.log(`Seeded ${inserted.length} products`);

    const demoUsers = [
      {
        name: "Demo User",
        email: "demo@example.com",
        password: "demo123",
        role: "user",
      },
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
      },
    ];

    for (const data of demoUsers) {
      const existing = await User.findOne({ email: data.email });
      if (!existing) {
        const user = await User.create(data);
        await Cart.create({ user: user._id, items: [] });
        console.log(`Created ${data.role}: ${data.email} / ${data.password}`);
      } else {
        console.log(`User already exists: ${data.email}`);
      }
    }

    console.log("Seed complete");
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

seed();
