# Order Service

[![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-black?logo=socketdotio)](https://socket.io/)

Order and payment microservice with real-time updates via Socket.IO.

## � Documentation

| Document                                                          | Description                            |
| ----------------------------------------------------------------- | -------------------------------------- |
| [Architecture](../../docs/services/order-service/ARCHITECTURE.md) | Service architecture & database schema |
| [API Reference](../../docs/services/order-service/API.md)         | REST API endpoints                     |
| [Testing Guide](../../docs/services/order-service/TESTING.md)     | Testing strategies                     |

## �🛠️ Tech Stack

| Category       | Technology             |
| -------------- | ---------------------- |
| **Framework**  | Express 4.18           |
| **Language**   | TypeScript 5.0+        |
| **Database**   | MongoDB (Mongoose 8.0) |
| **Real-time**  | Socket.IO 4.6          |
| **Auth**       | JWT (jsonwebtoken)     |
| **Validation** | express-validator      |
| **Security**   | Helmet, CORS           |
| **Docs**       | Swagger (OpenAPI)      |
| **Testing**    | Jest                   |

## ✨ Features

- Order CRUD operations
- Order status management
- Real-time status updates (Socket.IO)
- Payment processing integration
- Order history
- Invoice generation

## 🚀 Getting Started

```bash
# From monorepo root
yarn install
yarn dev:order

# Or from this directory
yarn dev
```

## 📁 Project Structure

```
services/order-service/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/      # Middleware
│   ├── services/        # Business logic
│   ├── sockets/         # Socket.IO handlers
│   └── index.ts         # Entry point
├── tests/               # Test files
└── package.json
```

## 🌐 Port

- **Development**: `http://localhost:4004`
- **Swagger Docs**: `http://localhost:4004/api-docs`

## 🔌 API Endpoints

| Method | Endpoint                   | Description   |
| ------ | -------------------------- | ------------- |
| GET    | `/api/orders`              | List orders   |
| GET    | `/api/orders/:id`          | Get order     |
| POST   | `/api/orders`              | Create order  |
| PUT    | `/api/orders/:id/status`   | Update status |
| GET    | `/api/orders/user/:userId` | User orders   |

## 📡 WebSocket Events

| Event           | Direction       | Description       |
| --------------- | --------------- | ----------------- |
| `order:created` | Server → Client | New order created |
| `order:updated` | Server → Client | Order updated     |
| `order:status`  | Server → Client | Status changed    |

## 📦 Shared Packages

- `@3asoftwares/types` - Type definitions
- `@3asoftwares/utils` - Utility functions

## 💻 Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `yarn dev`   | Start dev server (port 4004) |
| `yarn build` | Build TypeScript             |
| `yarn start` | Start production server      |
| `yarn test`  | Run tests                    |

## 🔐 Environment Variables

| Variable      | Description        |
| ------------- | ------------------ |
| `PORT`        | Server port        |
| `MONGODB_URI` | MongoDB connection |
| `JWT_SECRET`  | JWT verification   |

---

Part of the [E-Storefront Monorepo](../../README.md)
