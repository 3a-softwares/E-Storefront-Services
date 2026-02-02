# Auth Service

[![Express](https://img.shields.io/badge/Express-4.18-black?logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?logo=mongodb)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-orange)](https://jwt.io/)

Authentication and authorization microservice with JWT tokens, password reset, and email verification.

## � Documentation

| Document                                                         | Description                            |
| ---------------------------------------------------------------- | -------------------------------------- |
| [Architecture](../../docs/services/auth-service/ARCHITECTURE.md) | Service architecture & database schema |
| [API Reference](../../docs/services/auth-service/API.md)         | REST API endpoints                     |
| [Testing Guide](../../docs/services/auth-service/TESTING.md)     | Testing strategies                     |

## �🛠️ Tech Stack

| Category       | Technology             |
| -------------- | ---------------------- |
| **Framework**  | Express 4.18           |
| **Language**   | TypeScript 5.0+        |
| **Database**   | MongoDB (Mongoose 8.0) |
| **Auth**       | JWT (jsonwebtoken)     |
| **Password**   | bcryptjs               |
| **Email**      | Nodemailer             |
| **Validation** | express-validator      |
| **Security**   | Helmet, CORS           |
| **Docs**       | Swagger (OpenAPI)      |
| **Testing**    | Jest                   |

## ✨ Features

- User registration
- Login/Logout
- JWT access & refresh tokens
- Password reset via email
- Email verification
- Role-based access control
- OAuth integration ready

## 🚀 Getting Started

```bash
# From monorepo root
yarn install
yarn dev:auth

# Or from this directory
yarn dev
```

## 📁 Project Structure

```
services/auth-service/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/          # Mongoose models
│   ├── routes/          # Express routes
│   ├── middleware/      # Auth middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── index.ts         # Entry point
├── tests/               # Test files
└── package.json
```

## 🌐 Port

- **Development**: `http://localhost:4001`
- **Swagger Docs**: `http://localhost:4001/api-docs`

## 🔌 API Endpoints

| Method | Endpoint                    | Description        |
| ------ | --------------------------- | ------------------ |
| POST   | `/api/auth/register`        | Register user      |
| POST   | `/api/auth/login`           | Login user         |
| POST   | `/api/auth/refresh`         | Refresh token      |
| POST   | `/api/auth/logout`          | Logout user        |
| POST   | `/api/auth/forgot-password` | Password reset     |
| POST   | `/api/auth/verify-email`    | Email verification |

## 📦 Shared Packages

- `@3asoftwares/types` - Type definitions
- `@3asoftwares/utils` - Utility functions

## 💻 Scripts

| Command      | Description                  |
| ------------ | ---------------------------- |
| `yarn dev`   | Start dev server (port 4001) |
| `yarn build` | Build TypeScript             |
| `yarn start` | Start production server      |
| `yarn test`  | Run tests                    |

## 🔐 Environment Variables

| Variable         | Description        |
| ---------------- | ------------------ |
| `PORT`           | Server port        |
| `MONGODB_URI`    | MongoDB connection |
| `JWT_SECRET`     | JWT signing secret |
| `JWT_EXPIRES_IN` | Token expiration   |
| `SMTP_*`         | Email config       |

---

Part of the [E-Storefront Monorepo](../../README.md)
