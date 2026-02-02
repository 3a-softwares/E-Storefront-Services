# Product Service

[![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)](https://redis.io/)

Product catalog microservice with CRUD operations and Redis caching.

## � Documentation

| Document                                                            | Description                            |
| ------------------------------------------------------------------- | -------------------------------------- |
| [Architecture](../../docs/services/product-service/ARCHITECTURE.md) | Service architecture & database schema |
| [API Reference](../../docs/services/product-service/API.md)         | REST API endpoints                     |
| [Testing Guide](../../docs/services/product-service/TESTING.md)     | Testing strategies                     |

## �🛠️ Tech Stack

| Category       | Technology             |
| -------------- | ---------------------- |
| **Framework**  | Express 4.18           |
| **Language**   | TypeScript 5.0+        |
| **Database**   | MongoDB (Mongoose 8.0) |
| **Cache**      | Redis (ioredis)        |
| **Validation** | express-validator      |
| **Security**   | Helmet, CORS           |
| **Docs**       | Swagger (OpenAPI)      |
| **Testing**    | Jest                   |

## ✨ Features

- Product CRUD operations
- Product search & filtering
- Category association
- Inventory management
- Redis caching for performance
- Pagination & sorting
- Image management

## 🚀 Getting Started

```bash
# From monorepo root
yarn install
yarn dev:product

# Or from this directory
yarn dev
```

## 📁 Project Structure

```
services/product-service/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/      # Middleware
│   ├── services/        # Business logic
│   ├── cache/           # Redis cache layer
│   └── index.ts         # Entry point
├── tests/               # Test files
└── package.json
```

## 🌐 Port

- **Development**: `http://localhost:4005`
- **Swagger Docs**: `http://localhost:4005/api-docs`

## 🔌 API Endpoints

| Method | Endpoint               | Description     |
| ------ | ---------------------- | --------------- |
| GET    | `/api/products`        | List products   |
| GET    | `/api/products/:id`    | Get product     |
| POST   | `/api/products`        | Create product  |
| PUT    | `/api/products/:id`    | Update product  |
| DELETE | `/api/products/:id`    | Delete product  |
| GET    | `/api/products/search` | Search products |

## 📦 Shared Packages

- `@3asoftwares/types` - Type definitions
- `@3asoftwares/utils` - Utility functions

## 💻 Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `yarn dev`   | Start dev server (port 4005) |
| `yarn build` | Build TypeScript             |
| `yarn start` | Start production server      |
| `yarn test`  | Run tests                    |

## 🔐 Environment Variables

| Variable      | Description        |
| ------------- | ------------------ |
| `PORT`        | Server port        |
| `MONGODB_URI` | MongoDB connection |
| `REDIS_URL`   | Redis connection   |

---

Part of the [E-Storefront Monorepo](../../README.md)
