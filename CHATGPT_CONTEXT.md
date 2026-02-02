# ChatGPT Prompt for E-Storefront Services Development

## Context & Project Overview

You are helping develop the **E-Storefront Microservices Architecture** - a production-ready e-commerce backend built with TypeScript, Node.js, Express, MongoDB, and GraphQL.

### Project Structure

- **Monorepo Setup**: 7 independent microservices + 1 GraphQL Gateway
- **Services**: Auth, Category, Coupon, Order, Product, Ticket, + GraphQL Gateway
- **Tech Stack**: TypeScript, Express, MongoDB, Mongoose, GraphQL (Apollo), WebSockets, Redis
- **Node.js Version**: 20.11.1 (CANNOT be upgraded)
- **Yarn Version**: 1.22.22 Classic (CANNOT be upgraded)

### Critical Constraints

```
⚠️ DO NOT:
- Suggest updating Node.js or Yarn versions
- Create README.md files for documentation
- Use MongoDB v7.x (incompatible with Node 20.11.1 - use v6.3.0)
- Add unnecessary dependencies or dev dependencies
- Create files that aren't code

✅ DO:
- Keep dependencies minimal and compatible
- Use proper TypeScript types
- Maintain monorepo structure consistency
- Test across all 7 services
- Use environment variables from .env files
```

---

## Service Details

### Service Specifications

| Service              | Port | Key Features                 | DB              | Notes                       |
| -------------------- | ---- | ---------------------------- | --------------- | --------------------------- |
| **Auth Service**     | 3001 | JWT auth, role-based access  | MongoDB         | Handles user authentication |
| **Category Service** | 3002 | CRUD categories              | MongoDB         | Product categorization      |
| **Coupon Service**   | 3003 | Coupon management            | MongoDB         | Discount codes              |
| **Order Service**    | 3004 | Orders, payments, WebSockets | MongoDB         | Real-time updates           |
| **Product Service**  | 3005 | Product catalog              | MongoDB + Redis | Caching enabled             |
| **Ticket Service**   | 3006 | Support tickets              | MongoDB         | Customer support            |
| **GraphQL Gateway**  | 4000 | GraphQL aggregation          | N/A             | Aggregates all services     |

### Common Dependencies (All Services)

```json
"@3asoftwares/types": "^1.0.7",
"@3asoftwares/utils": "1.0.10",
"express": "^4.18.2",
"mongoose": "^8.0.3",
"jsonwebtoken": "^9.0.2",
"dotenv": "^16.3.1",
"cors": "^2.8.5",
"helmet": "^7.1.0"
```

### MongoDB Driver Version

```json
"mongodb": "6.3.0"  // LOCKED - Must stay at 6.3.0 for Node 20.11.1 compatibility
```

---

## Development Workflow

### Initial Setup

```bash
# Install all dependencies (automatically installs in all services)
yarn install

# Build all services
yarn build

# Run all services in development mode
yarn dev

# Run specific service
yarn dev:auth      # or category, coupon, gateway, order, product, ticket
```

### Service Health Check Endpoints

```
Auth Service:      GET http://localhost:3001/health
Category Service:  GET http://localhost:3002/health
Coupon Service:    GET http://localhost:3003/health
Order Service:     GET http://localhost:3004/health
Product Service:   GET http://localhost:3005/health
Ticket Service:    GET http://localhost:3006/health
GraphQL Gateway:   GET http://localhost:4000/health
GraphQL Endpoint:  POST http://localhost:4000/graphql
```

---

## Common Tasks & Solutions

### Adding a New Dependency to a Service

```bash
yarn workspace @3asoftwares/SERVICE-NAME add PACKAGE_NAME
# Example: yarn workspace @3asoftwares/auth-service add bcryptjs
```

### Removing Unnecessary Dependencies

```bash
# Review and remove unused packages from package.json
# Only keep: types, utils, express, mongoose, dotenv, cors, helmet, etc.
```

### Fixing TypeScript Compilation Errors

1. Ensure all function parameters have types
2. Add return type annotations to functions
3. Use `: any` sparingly - prefer proper types
4. Check `tsconfig.json` for strict mode settings

### Database Connection Issues

- Verify `MONGODB_URI` in .env: `mongodb://localhost:27017/ecommerce`
- Ensure MongoDB is running
- Check connection string syntax

### Port Already in Use

```bash
# Windows: Find and kill process
netstat -ano | findstr :PORT_NUMBER
taskkill /F /PID PID_ID
```

---

## Architecture Patterns

### Service Structure

```
service-name/
├── src/
│   ├── index.ts           # Entry point
│   ├── config/            # Configuration files
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── swagger/           # API documentation
├── tests/                 # Jest tests
├── dist/                  # Compiled JavaScript
├── package.json
├── tsconfig.json
└── jest.config.js
```

### Common Patterns

- **Controllers**: Handle HTTP requests/responses
- **Services**: Encapsulate business logic
- **Models**: Define MongoDB schemas with Mongoose
- **Middleware**: Authentication, validation, error handling
- **Routes**: Map URLs to controllers

---

## Testing & Quality

### Run Tests

```bash
yarn test                    # All services
yarn workspace @3asoftwares/auth-service run test
```

### Build Validation

```bash
yarn build                   # Should complete with zero errors
```

---

## Data Seeding (Future Implementation)

The project supports seeding sample data into MongoDB:

```bash
# POST /api/seed endpoint (requires admin auth)
curl -X POST http://localhost:4000/api/seed \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## When Asking for Help

Provide the following context:

1. **Which service(s)** are affected
2. **Error message** (full stack trace if available)
3. **What you're trying to do** (user story)
4. **Current Node/Yarn versions** (confirm they're still 20.11.1 / 1.22.22)
5. **.env configuration** (if relevant)
6. **Code snippet** (if applicable)

### Example Good Request

```
"I'm trying to add password validation to the Auth Service.
Service: auth-service (port 3001)
Error: Cannot find module 'joi'
Environment: Node 20.11.1, Yarn 1.22.22, MongoDB connected
Goal: Add joi validation to user registration endpoint"
```

---

## Important Notes for Future Sessions

### Remember:

- ✅ Node.js 20.11.1 (FIXED - don't upgrade)
- ✅ Yarn 1.22.22 (FIXED - don't upgrade)
- ✅ MongoDB 6.3.0 (LOCKED - for Node compatibility)
- ✅ 7 services + 1 gateway (monorepo structure)
- ✅ All services have health check endpoints
- ✅ GraphQL gateway on port 4000
- ✅ Use environment variables for configuration

### Never:

- ❌ Suggest Node.js or Yarn upgrades
- ❌ Use MongoDB v7.x or later
- ❌ Create unnecessary README files
- ❌ Add bloated dependencies
- ❌ Hardcode configuration values

---

## Quick Reference

### Services by Port

```
3001 - Auth
3002 - Category
3003 - Coupon
3004 - Order
3005 - Product
3006 - Ticket
4000 - GraphQL Gateway
6379 - Redis (optional, for Product Service caching)
27017 - MongoDB
```

### Yarn Workspace Commands

```bash
yarn install                                          # Install all dependencies
yarn build                                            # Build all services
yarn dev                                              # Dev mode for all
yarn workspace @3asoftwares/auth-service run build  # Build one service
yarn workspace @3asoftwares/auth-service run dev    # Dev one service
```

### Common Health Check Pattern

```bash
for port in 3001 3002 3003 3004 3005 3006 4000; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health | jq .
done
```

---

## Contact & Support

For questions about this monorepo structure, implementation details, or development guidance, refer back to these guidelines and the HEALTH_CHECK_ENDPOINTS.md file.
