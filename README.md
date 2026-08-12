# E-Shop Server

A RESTful e-commerce API built with **Express 5**, **Prisma 7** (PostgreSQL), **TypeScript**, and **Zod** validation.

## Features

- Auth module (register / login) issuing JWTs
- CRUD + soft delete for Users, Categories, Products, Reviews, Orders
- Role-based access (ADMIN / MODERATOR / USER)
- Pagination, search, and filtering
- Soft deletes everywhere (`isDeleted` flag, never hard-deleted)
- Consistent response envelope and centralized error handling

## Tech Stack

| Concern        | Choice                                |
| -------------- | ------------------------------------- |
| Runtime        | Node.js >= 20                         |
| Language       | TypeScript 7 (ESM)                    |
| Framework      | Express 5                            |
| ORM            | Prisma 7 + `@prisma/adapter-pg`      |
| Database       | PostgreSQL (Neon / Supabase / local) |
| Validation     | Zod                                   |
| Auth           | JSON Web Token (jsonwebtoken) + bcrypt |
| Dev runner     | tsx                                   |

## Project Structure

```
src/
├── app.ts                 # Express app, mounts /api router + error handler
├── server.ts              # Entry point (dotenv, listen, graceful shutdown)
├── routes/                # Router per module (auth, user, category, product, review, order)
├── controllers/<module>/  # HTTP handlers (sendResponse + catchAsync)
├── services/<module>/     # Business logic + Prisma queries
├── middlewares/           # authenticate, authorize
├── lib/                   # prisma singleton, sendResponse, catchAsync, validate, AppError, globalErrorHandler, db, pagination
└── types/                 # Express Request augmentation (req.user)
prisma/
├── schema.prisma          # Data model + enums
└── migrations/            # Baselines
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable              | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string (Neon pooled for apps) |
| `DIRECT_DATABASE_URL` | Direct (non-pooled) URL for Prisma migrations       |
| `JWT_SECRET`          | Secret used to sign JWTs (use a strong random value)|
| `PORT`                | Port to listen on (default 5000)                     |
| `NODE_ENV`            | `production` / `development`                         |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    edit .env and set DATABASE_URL, DIRECT_DATABASE_URL, JWT_SECRET

# 3. Create the database schema
npx prisma migrate dev --name init
#    (or for an already-pushed DB) npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Run in development
npm run dev

# Build & run in production
npm run build
npm run start
```

## Response Envelope

All responses follow a consistent shape.

**Success**

```json
{ "success": true, "message": "OK", "data": { ... } }
```

List endpoints return paginated data:

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "data": [ ... ],
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

**Error**

```json
{ "success": false, "message": "Invalid credentials", "error": { "statusCode": 401 } }
```

In production, `error` is omitted for unexpected errors.

### Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | OK                                   |
| 201  | Created                              |
| 400  | Validation error (Zod) / bad input  |
| 401  | Authentication required / invalid token |
| 403  | Insufficient permissions             |
| 404  | Not found (or soft-deleted)          |
| 409  | Conflict (duplicate / constraint)    |
| 500  | Unexpected server error              |

## Authentication

Protected routes require an `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token via `POST /api/auth/login` (or register). The token payload contains `{ id, email, role }` and expires in 7 days.

---

# API Documentation

Base URL: `/api`

## Auth

### POST /api/auth/register

Register a new user.

**Body**

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Jane Doe",
  "role": "USER"            // optional: ADMIN | USER | MODERATOR, default USER
}
```

**Responses**

- `201` → `{ success, message, data: { user, token } }`
- `400` → invalid email / short password
- `409` → email already registered

### POST /api/auth/login

**Body**

```json
{ "email": "user@example.com", "password": "secret123" }
```

**Responses**

- `200` → `{ success, message, data: { user, token } }`
- `400` → validation error
- `401` → invalid credentials

---

## Users (admin only for list / update / delete)

### GET /api/users

List all users (paginated). **Admin only.**

**Query:** `?page=1&limit=10`

**Responses**

- `200` → paginated `data`
- `401` → not authenticated
- `403` → not admin

### GET /api/users/:id

Get a single user (any authenticated user).

**Responses**

- `200` → `{ success, message, data: { id, email, name, role, isActive, createdAt, updatedAt } }`
- `401`, `404`

### PATCH /api/users/:id

Update a user. **Admin only.**

**Body** (all optional)

```json
{ "name": "New Name", "email": "new@example.com", "role": "MODERATOR" }
```

**Responses**

- `200` → updated user
- `400` → validation error / `role` not in enum
- `401`, `403`, `404`

### DELETE /api/users/:id

Soft delete a user. **Admin only.**

**Responses**

- `200` → deleted user (`isDeleted: true`)
- `401`, `403`, `404`

---

## Categories

### GET /api/categories

List categories (public).

**Query:** `?page=1&limit=10&search=phone&parentId=<id|null>`

**Responses**

- `200` → paginated `data`
- `400` → invalid query

### GET /api/categories/:id

**Responses:** `200`, `404`

### POST /api/categories

Create a category. **Admin only.**

**Body**

```json
{
  "name": "Electronics",
  "slug": "electronics",     // optional, kebab-case; auto-generated from name if omitted
  "parentId": null           // optional, self-relation (null or category id)
}
```

**Responses**

- `201` → created category
- `400` → invalid slug / parent not found / self-parent
- `401`, `403`
- `409` → slug already exists

### PATCH /api/categories/:id

**Admin only.** Body same as create (all optional).

**Responses:** `200`, `400`, `401`, `403`, `404`, `409`

### DELETE /api/categories/:id

**Admin only.** Cannot delete a category that has children.

**Responses**

- `200` → soft-deleted category
- `401`, `403`, `404`
- `409` → category has child categories

---

## Products

### GET /api/products

List products (public).

**Query:**
`?page=1&limit=10&search=phone&categoryId=<id>&status=PUBLISHED&sellerId=<id>&sortBy=createdAt|price|name|updatedAt&order=asc|desc`

**Responses:** `200` → paginated `data`; `400` → invalid query

### GET /api/products/:id

Returns the product **with its categories and reviews** (public).

**Responses:** `200`, `404`

### POST /api/products

Create a product (authenticated; linked to the requesting user as `seller`).

**Body**

```json
{
  "name": "Smartphone X",
  "slug": "smartphone-x",          // optional, kebab-case
  "description": "Flagship phone", // optional
  "price": 699.99,
  "stock": 50,
  "status": "PUBLISHED",           // optional: DRAFT | PUBLISHED | ARCHIVED, default DRAFT
  "categoryIds": ["<categoryId>"]  // at least one valid, non-deleted category
}
```

**Notes:** `total` for orders is computed server-side from product prices; `slug` must be unique.

**Responses**

- `201` → created product
- `400` → invalid price/stock/slug / missing categories / unknown category
- `401`
- `409` → slug already exists

### PATCH /api/products/:id

**Authenticated** (owner or admin). Body same as create (all optional). Replaces category links when `categoryIds` is provided.

**Responses:** `200`, `400`, `401`, `404`, `409`

### DELETE /api/products/:id

**Authenticated** (owner or admin). Soft delete.

**Responses:** `200` → soft-deleted product; `401`, `404`

---

## Reviews

### GET /api/reviews

List reviews **for a product** (public). Requires `productId`.

**Query:** `?productId=<id>&page=1&limit=10&sortBy=createdAt|rating&order=asc|desc`

**Responses**

- `200` → paginated reviews
- `400` → missing/invalid `productId`
- `404` → product not found

### GET /api/reviews/:id

**Responses:** `200`, `404`

### POST /api/reviews

Create a review (authenticated; linked to user + product). One review per user/product.

**Body**

```json
{ "productId": "<id>", "rating": 5, "comment": "Great!" }
```

`rating` is an integer 1–5.

**Responses**

- `201` → created review
- `400` → invalid rating / missing productId
- `401`
- `404` → product not found
- `409` → already reviewed this product

### PATCH /api/reviews/:id

Update own review. **Owner only.**

**Body** (optional): `{ "rating": 4, "comment": "Updated" }`

**Responses:** `200`, `400`, `401`, `403`, `404`

### DELETE /api/reviews/:id

Delete a review. **Owner or admin.**

**Responses:** `200` → soft-deleted review; `401`, `403`, `404`

---

## Orders

### POST /api/orders

Create an order (authenticated). Items are created in a transaction; `total` is computed from current product prices.

**Body**

```json
{
  "items": [
    { "productId": "<id>", "quantity": 2 }
  ]
}
```

**Responses**

- `201` → `{ success, message, data: { id, status, total, userId, items, ... } }`
- `400` → unknown product / invalid item
- `401`

### GET /api/orders

List orders. **Authenticated.** A normal user sees only their own; an admin sees all.

**Query:** `?page=1&limit=10&status=PENDING&sortBy=createdAt|updatedAt|total&order=asc|desc`

**Responses:** `200` → paginated `data`; `401`

### GET /api/orders/:id

Get an order. **Owner or admin.**

**Responses:** `200`, `401`, `403`, `404`

### PATCH /api/orders/:id/status

Update order status. **Admin only.**

**Body**

```json
{ "status": "CONFIRMED" }
```

`status` ∈ `PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED | REFUNDED`.

**Responses:** `200`, `400`, `401`, `403`, `404`

### DELETE /api/orders/:id

Cancel an order (soft delete + `status: CANCELLED`). **Owner or admin.**

**Responses:** `200` → cancelled order; `401`, `403`, `404`

---

## Enums

| Enum         | Values                                            |
| ------------ | ------------------------------------------------- |
| `UserRole`   | `ADMIN`, `USER`, `MODERATOR`                      |
| `ProductStatus` | `DRAFT`, `PUBLISHED`, `ARCHIVED`               |
| `OrderStatus`| `PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |

## Data Model (summary)

- **User** `id, email (unique), passwordHash, name, role, isActive, isDeleted, timestamps`
- **Category** `id, name, slug (unique), parentId (self), isDeleted, timestamps`
- **Product** `id, name, slug (unique), description, price, stock, status, sellerId, isDeleted, timestamps` — linked to Category via `ProductCategory` join
- **Review** `id, rating, comment, productId, userId, isDeleted, timestamps` — `@@unique([productId, userId])`
- **Order** `id, status, total, userId, isDeleted, timestamps` — has many `OrderItem` (productId, quantity, unitPrice)
- **WishlistItem** `id, userId, productId, isDeleted, timestamps` — `@@unique([userId, productId])`

All models include `createdAt`, `updatedAt`, and a soft-delete `isDeleted` flag.

## Error Handling

All errors are funneled through `globalErrorHandler`:

- `AppError` → uses its `statusCode` (default 400/401/403/404/409)
- `ZodError` → `400` with field messages
- `PrismaClientKnownRequestError` → `P2002` → 409, `P2025` → 404
- Everything else → `500`

## Deployment (Render)

A `render.yaml` Blueprint is provided:

- Runtime: Node, build `npm install && npm run build`, start `npm run start`
- `prestart` runs `prisma migrate deploy`
- Health check path: `/`
- Set `DATABASE_URL`, `DIRECT_DATABASE_URL`, `JWT_SECRET` in the Render dashboard

## Scripts

| Script            | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Run with hot reload (tsx)                |
| `npm run build`   | `prisma generate && tsc`                |
| `npm run start`   | `node dist/src/server.js`               |
| `npm run migrate` | `prisma migrate deploy`                 |
| `npx prisma studio` | Browse the database                    |
