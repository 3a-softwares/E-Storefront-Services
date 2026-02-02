# Category Service

[![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com/)

Category management microservice with CRUD operations and hierarchical structure.

## � Documentation

| Document                                                             | Description                            |
| -------------------------------------------------------------------- | -------------------------------------- |
| [Architecture](../../docs/services/category-service/ARCHITECTURE.md) | Service architecture & database schema |
| [API Reference](../../docs/services/category-service/API.md)         | REST API endpoints                     |
| [Testing Guide](../../docs/services/category-service/TESTING.md)     | Testing strategies                     |

## �🛠️ Tech Stack

| Category       | Technology             |
| -------------- | ---------------------- |
| **Framework**  | Express 4.18           |
| **Language**   | TypeScript 5.0+        |
| **Database**   | MongoDB (Mongoose 8.0) |
| **Validation** | express-validator      |
| **Security**   | Helmet, CORS           |
| **Docs**       | Swagger (OpenAPI)      |
| **Testing**    | Jest                   |

## ✨ Features

- Category CRUD operations
- Hierarchical categories (parent/child)
- Category tree structure
- Product association
- Slug generation
- Image management

## 🚀 Getting Started

```bash
# From monorepo root
yarn install
yarn dev:category

# Or from this directory
yarn dev
```

## 📁 Project Structure

```
services/category-service/
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

- **Development**: `http://localhost:4002`
- **Swagger Docs**: `http://localhost:4002/api-docs`

## 🔌 API Endpoints

| Method | Endpoint               | Description       |
| ------ | ---------------------- | ----------------- |
| GET    | `/api/categories`      | List categories   |
| GET    | `/api/categories/:id`  | Get category      |
| POST   | `/api/categories`      | Create category   |
| PUT    | `/api/categories/:id`  | Update category   |
| DELETE | `/api/categories/:id`  | Delete category   |
| GET    | `/api/categories/tree` | Get category tree |

## 📦 Shared Packages

- `@3asoftwares/types` - Type definitions
- `@3asoftwares/utils` - Utility functions

## 💻 Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `yarn dev`   | Start dev server (port 4002) |
| `yarn build` | Build TypeScript             |
| `yarn start` | Start production server      |
| `yarn test`  | Run tests                    |

## 🔐 Environment Variables

| Variable      | Description        |
| ------------- | ------------------ |
| `PORT`        | Server port        |
| `MONGODB_URI` | MongoDB connection |

---

Part of the [E-Storefront Monorepo](../../README.md)
