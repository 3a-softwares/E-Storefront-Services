# Coupon Service

[![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com/)

Coupon and discount management microservice with validation and usage tracking.

## � Documentation

| Document                                                           | Description                            |
| ------------------------------------------------------------------ | -------------------------------------- |
| [Architecture](../../docs/services/coupon-service/ARCHITECTURE.md) | Service architecture & database schema |
| [API Reference](../../docs/services/coupon-service/API.md)         | REST API endpoints                     |
| [Testing Guide](../../docs/services/coupon-service/TESTING.md)     | Testing strategies                     |

## �🛠️ Tech Stack

| Category       | Technology             |
| -------------- | ---------------------- |
| **Framework**  | Express 4.18           |
| **Language**   | TypeScript 5.0+        |
| **Database**   | MongoDB (Mongoose 8.0) |
| **Auth**       | JWT (jsonwebtoken)     |
| **Validation** | express-validator      |
| **Security**   | Helmet, CORS           |
| **Docs**       | Swagger (OpenAPI)      |
| **Testing**    | Jest                   |

## ✨ Features

- Coupon CRUD operations
- Percentage & fixed discounts
- Usage limits & tracking
- Expiration dates
- Minimum order requirements
- Product/category restrictions
- Coupon validation

## 🚀 Getting Started

```bash
# From monorepo root
yarn install
yarn dev:coupon

# Or from this directory
yarn dev
```

## 📁 Project Structure

```
services/coupon-service/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/      # Middleware
│   ├── services/        # Business logic
│   └── index.ts         # Entry point
├── tests/               # Test files
└── package.json
```

## 🌐 Port

- **Development**: `http://localhost:4003`
- **Swagger Docs**: `http://localhost:4003/api-docs`

## 🔌 API Endpoints

| Method | Endpoint                | Description     |
| ------ | ----------------------- | --------------- |
| GET    | `/api/coupons`          | List coupons    |
| GET    | `/api/coupons/:id`      | Get coupon      |
| POST   | `/api/coupons`          | Create coupon   |
| PUT    | `/api/coupons/:id`      | Update coupon   |
| DELETE | `/api/coupons/:id`      | Delete coupon   |
| POST   | `/api/coupons/validate` | Validate coupon |
| POST   | `/api/coupons/apply`    | Apply coupon    |

## 📦 Shared Packages

- `@3asoftwares/types` - Type definitions
- `@3asoftwares/utils` - Utility functions

## 💻 Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `yarn dev`        | Start dev server (port 4003) |
| `yarn build`      | Build TypeScript             |
| `yarn build:prod` | Production build             |
| `yarn start`      | Start production server      |
| `yarn test`       | Run tests                    |

## 🔐 Environment Variables

| Variable      | Description        |
| ------------- | ------------------ |
| `PORT`        | Server port        |
| `MONGODB_URI` | MongoDB connection |
| `JWT_SECRET`  | JWT verification   |

---

Part of the [E-Storefront Monorepo](../../README.md)
