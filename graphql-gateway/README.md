# GraphQL Gateway

[![Apollo Server](https://img.shields.io/badge/Apollo_Server-4.0-purple?logo=apollographql)](https://www.apollographql.com/)
[![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)](https://expressjs.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16.0-pink?logo=graphql)](https://graphql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

GraphQL API gateway that aggregates all backend microservices into a unified API.

## � Documentation

| Document                                                            | Description                          |
| ------------------------------------------------------------------- | ------------------------------------ |
| [Architecture](../../docs/services/graphql-gateway/ARCHITECTURE.md) | Service architecture & schema design |
| [API Reference](../../docs/services/graphql-gateway/API.md)         | GraphQL API reference                |
| [Testing Guide](../../docs/services/graphql-gateway/TESTING.md)     | Testing strategies                   |

## �🛠️ Tech Stack

| Category      | Technology                      |
| ------------- | ------------------------------- |
| **Framework** | Apollo Server 4.0, Express 4.18 |
| **Language**  | TypeScript 5.0+                 |
| **API**       | GraphQL 16                      |
| **HTTP**      | Axios                           |
| **Schema**    | @graphql-tools/schema           |
| **Security**  | Helmet, CORS                    |
| **Testing**   | Jest                            |

## ✨ Features

- Unified GraphQL API
- Service aggregation
- Schema stitching
- Query batching
- Error handling
- Authentication passthrough
- Real-time subscriptions ready

## 🚀 Getting Started

```bash
# From monorepo root
yarn install
yarn dev:gateway

# Or from this directory
yarn dev
```

## 📁 Project Structure

```
services/graphql-gateway/
├── src/
│   ├── resolvers/       # GraphQL resolvers
│   ├── typeDefs/        # GraphQL schemas
│   ├── datasources/     # Service connectors
│   ├── middleware/      # Auth middleware
│   └── index.ts         # Entry point
├── tests/               # Test files
└── package.json
```

## 🌐 Port

- **Development**: `http://localhost:4000`
- **GraphQL Playground**: `http://localhost:4000/graphql`

## 🔌 Schema Overview

```graphql
type Query {
  # Auth
  me: User

  # Products
  products(filter: ProductFilter): [Product!]!
  product(id: ID!): Product

  # Categories
  categories: [Category!]!
  category(id: ID!): Category

  # Orders
  orders: [Order!]!
  order(id: ID!): Order

  # Coupons
  coupons: [Coupon!]!
}

type Mutation {
  # Auth
  login(input: LoginInput!): AuthPayload!
  register(input: RegisterInput!): AuthPayload!

  # Cart
  addToCart(input: CartInput!): Cart!

  # Orders
  createOrder(input: OrderInput!): Order!
}
```

## 📦 Connected Services

| Service          | Port | Description    |
| ---------------- | ---- | -------------- |
| Auth Service     | 4001 | Authentication |
| Category Service | 4002 | Categories     |
| Coupon Service   | 4003 | Coupons        |
| Order Service    | 4004 | Orders         |
| Product Service  | 4005 | Products       |
| Ticket Service   | 4006 | Support        |

## 📦 Shared Packages

- `@3asoftwares/types` - Type definitions
- `@3asoftwares/utils` - Utility functions

## 💻 Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `yarn dev`   | Start dev server (port 4000) |
| `yarn build` | Build TypeScript             |
| `yarn start` | Start production server      |
| `yarn test`  | Run tests                    |

## 🔐 Environment Variables

| Variable               | Description          |
| ---------------------- | -------------------- |
| `PORT`                 | Server port          |
| `AUTH_SERVICE_URL`     | Auth service URL     |
| `PRODUCT_SERVICE_URL`  | Product service URL  |
| `ORDER_SERVICE_URL`    | Order service URL    |
| `CATEGORY_SERVICE_URL` | Category service URL |
| `COUPON_SERVICE_URL`   | Coupon service URL   |

---

Part of the [E-Storefront Monorepo](../../README.md)
