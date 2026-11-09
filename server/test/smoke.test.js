import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const { default: app } = await import("../src/app.js");
const { default: Product } = await import("../src/models/Product.js");

let mongo;
let server;
let baseUrl;

before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongo.stop();
});

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test("full purchase flow", async (t) => {
  const product = await Product.create({
    name: "Test Widget",
    description: "A widget for testing",
    price: 25,
    stock: 10,
    category: "Testing",
  });

  let token;
  let userId;

  await t.test("register creates user and cart", async () => {
    const { status, json } = await call("POST", "/api/auth/register", {
      body: { name: "Test User", email: "tester@example.com", password: "secret123" },
    });
    assert.equal(status, 201);
    assert.ok(json.data.token);
    assert.equal(json.data.user.email, "tester@example.com");
    assert.equal(json.data.user.password, undefined);
    token = json.data.token;
    userId = json.data.user._id;
  });

  await t.test("duplicate email is rejected", async () => {
    const { status } = await call("POST", "/api/auth/register", {
      body: { name: "Test User", email: "tester@example.com", password: "secret123" },
    });
    assert.equal(status, 409);
  });

  await t.test("login works", async () => {
    const { status, json } = await call("POST", "/api/auth/login", {
      body: { email: "tester@example.com", password: "secret123" },
    });
    assert.equal(status, 200);
    assert.ok(json.data.token);
  });

  await t.test("me reflects the token", async () => {
    const { status, json } = await call("GET", "/api/auth/me", { token });
    assert.equal(status, 200);
    assert.equal(json.data.user._id, userId);
  });

  await t.test("products list and search", async () => {
    const all = await call("GET", "/api/products");
    assert.equal(all.status, 200);
    assert.equal(all.json.total, 1);

    const search = await call("GET", "/api/products?search=widget");
    assert.equal(search.json.total, 1);

    const categories = await call("GET", "/api/products/categories");
    assert.deepEqual(categories.json.data, ["Testing"]);
  });

  await t.test("add to cart enforces stock", async () => {
    const tooMany = await call("POST", "/api/cart", {
      token,
      body: { productId: product._id.toString(), quantity: 99 },
    });
    assert.equal(tooMany.status, 400);

    const ok = await call("POST", "/api/cart", {
      token,
      body: { productId: product._id.toString(), quantity: 2 },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.data.totalItems, 2);
    assert.equal(ok.json.data.total, 50);
  });

  let orderId;

  await t.test("place order decrements stock and clears cart", async () => {
    const { status, json } = await call("POST", "/api/orders", {
      token,
      body: {
        shippingAddress: {
          street: "1 Test St",
          city: "Testville",
          state: "TS",
          zipCode: "12345",
          country: "Testland",
        },
      },
    });
    assert.equal(status, 201);
    assert.equal(json.data.totalAmount, 50);
    assert.equal(json.data.status, "pending");
    orderId = json.data._id;

    const updated = await Product.findById(product._id);
    assert.equal(updated.stock, 8);

    const cart = await call("GET", "/api/cart", { token });
    assert.equal(cart.json.data.totalItems, 0);
  });

  await t.test("order appears in history", async () => {
    const { status, json } = await call("GET", "/api/orders", { token });
    assert.equal(status, 200);
    assert.equal(json.count, 1);
  });

  await t.test("cancel restores stock", async () => {
    const { status, json } = await call("PATCH", `/api/orders/${orderId}/cancel`, {
      token,
    });
    assert.equal(status, 200);
    assert.equal(json.data.status, "cancelled");

    const updated = await Product.findById(product._id);
    assert.equal(updated.stock, 10);
  });

  await t.test("cancelling twice is rejected", async () => {
    const { status } = await call("PATCH", `/api/orders/${orderId}/cancel`, { token });
    assert.equal(status, 400);
  });

  await t.test("protected routes reject anonymous requests", async () => {
    const { status } = await call("GET", "/api/cart");
    assert.equal(status, 401);
  });
});
