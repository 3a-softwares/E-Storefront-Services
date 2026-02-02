# Ticket Service

Support ticket management service for the E-Storefront platform.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](../../docs/services/ticket-service/ARCHITECTURE.md) | Service architecture & database schema |
| [API Reference](../../docs/services/ticket-service/API.md) | REST API endpoints |
| [Testing Guide](../../docs/services/ticket-service/TESTING.md) | Testing strategies |

## Features

- Create, read, update, delete support tickets
- Assign tickets to support agents
- Resolve tickets with resolution notes
- Add comments to tickets
- Support user management with admin/agent roles
- JWT-based authentication
- MongoDB database

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Seed the database with sample data
npx ts-node src/seeds/seedData.ts

# Start development server
npm run dev
```

### API Endpoints

#### Tickets

- `GET /api/tickets` - Get all tickets (protected)
- `GET /api/tickets/:id` - Get ticket by ID (protected)
- `POST /api/tickets` - Create a new ticket (public)
- `PUT /api/tickets/:id` - Update a ticket (protected)
- `PATCH /api/tickets/:id/assign` - Assign ticket to agent (admin only)
- `PATCH /api/tickets/:id/resolve` - Resolve a ticket (protected)
- `POST /api/tickets/:id/comment` - Add comment to ticket (protected)
- `DELETE /api/tickets/:id` - Delete a ticket (admin only)
- `GET /api/tickets/stats` - Get ticket statistics (protected)

#### Support Users

- `POST /api/support-users/login` - Login
- `GET /api/support-users/me` - Get current user profile (protected)
- `GET /api/support-users` - Get all support users (admin only)
- `GET /api/support-users/:id` - Get support user by ID (admin only)
- `POST /api/support-users` - Create support user (admin only)
- `PUT /api/support-users/:id` - Update support user (admin only)
- `DELETE /api/support-users/:id` - Delete support user (admin only)

### Default Credentials

- **Admin**: admin@3asoftwares.com / admin123
- **Agent**: support1@3asoftwares.com / support123

## Environment Variables

| Variable        | Description               | Default                                        |
| --------------- | ------------------------- | ---------------------------------------------- |
| PORT            | Server port               | 3009                                           |
| MONGODB_URI     | MongoDB connection string | mongodb://localhost:27017/e-storefront-tickets |
| JWT_SECRET      | JWT secret key            | -                                              |
| JWT_EXPIRES_IN  | JWT expiration time       | 7d                                             |
| ALLOWED_ORIGINS | CORS allowed origins      | -                                              |

## API Documentation

Swagger documentation is available at `http://localhost:3009/api-docs` when the server is running.
