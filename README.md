# Shoply — MERN E-Commerce (Practice Project)

A full-stack e-commerce app built with **MongoDB, Express, React (Vite), Node.js**.
It covers the real-world core flow: register/login with JWT, browse and filter
products, manage a cart, check out, view orders, and cancel orders with stock
restoration.

```
mern-ecommerce/
├── server/                 # Express + Mongoose API
│   ├── src/
│   │   ├── config/         # Mongo connection
│   │   ├── controllers/    # auth, products, cart, orders
│   │   ├── middleware/     # JWT auth, admin guard, error handling
│   │   ├── models/         # User, Product, Cart, Order
│   │   ├── routes/         # /api/auth, /api/products, /api/cart, /api/orders
│   │   ├── seed/           # demo data + demo accounts
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── client/                 # React + Vite frontend
    ├── src/
    │   ├── api/            # axios instance + auth interceptor
    │   ├── context/        # AuthContext, CartContext
    │   ├── components/     # Navbar, ProductCard, ProtectedRoute, ...
    │   ├── pages/          # Home, Products, ProductDetail, Cart, Checkout, ...
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## 1. Prerequisites

- Node.js 18+ (you have 24.x)
- A MongoDB database — MongoDB Atlas free tier works well
  (https://www.mongodb.com/cloud/atlas)

## 2. Backend setup

```bash
cd server
npm install
```

Edit `server/.env` and set your Atlas connection string:

```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/mern-ecommerce?retryWrites=true&w=majority
```

Then seed demo products and accounts:

```bash
npm run seed
```

Start the API (auto-restarts on changes):

```bash
npm run dev
# API: http://localhost:5000
# Health: http://localhost:5000/api/health
```

## 3. Frontend setup

```bash
cd client
npm install
npm run dev
# App: http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:5000`, so no extra
config is needed locally.

## 4. Demo accounts (created by the seed script)

| Role  | Email             | Password  |
|-------|-------------------|-----------|
| User  | demo@example.com  | demo123   |
| Admin | admin@example.com | admin123  |

## 5. API reference

Base URL: `http://localhost:5000/api`

Responses follow `{ success, message?, data? }`. Protected routes need
`Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create account, returns user + JWT |
| POST | `/auth/login` | – | Log in, returns user + JWT |
| GET | `/auth/me` | ✔ | Current user |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | – | List/filter products |
| GET | `/products/categories` | – | Distinct categories |
| GET | `/products/:id` | – | Single product |
| POST | `/products` | admin | Create product |
| PUT | `/products/:id` | admin | Update product |
| DELETE | `/products/:id` | admin | Delete product |

Product query params: `search`, `category`, `minPrice`, `maxPrice`, `inStock=true`,
`sort` (`newest|priceAsc|priceDesc|nameAsc|ratingDesc`), `page`, `limit`.

### Cart (all protected)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/cart` | Cart with populated items + totals |
| POST | `/cart` | Add `{ productId, quantity }` |
| PUT | `/cart/:productId` | Set `{ quantity }` (0 removes) |
| DELETE | `/cart/:productId` | Remove one item |
| DELETE | `/cart` | Clear cart |

### Orders (all protected)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders` | Place order from cart `{ shippingAddress }` |
| GET | `/orders` | Current user's orders |
| GET | `/orders/:id` | Order detail (owner or admin) |
| PATCH | `/orders/:id/cancel` | Cancel + restore stock |

## 6. How the core flow works

1. Register → a JWT is stored in `localStorage` and an empty cart document is created.
2. Adding to cart validates stock and increments quantity if the item already exists.
3. Checkout re-validates stock, atomically decrements it, creates the order, and
   clears the cart. If any stock update fails, earlier decrements are rolled back.
4. Cancelling an order restores stock and sets the status to `cancelled`.

## 7. Tests

The backend ships with an end-to-end smoke test that runs against an in-memory
MongoDB (no Atlas credentials needed):

```bash
cd server
npm test
```

It covers register/login, duplicate-email rejection, product search, stock checks,
add-to-cart, order placement with stock decrement and cart clearing, order history,
cancel with stock restoration, and protection of authenticated routes.

## 8. Notes for practice / next steps

- The admin role exists in the API (product write endpoints are admin-only) but
  there is no admin UI yet — a good next exercise.
- Ideas to extend: product reviews, wishlists, payment gateway (Stripe), order
  status transitions, image uploads, refresh tokens, and automated tests.
- Never commit `server/.env`. It is already git-ignored.
