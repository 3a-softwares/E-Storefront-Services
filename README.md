# e-services — Backend Microservices Monorepo

Backend microservices for the e-commerce platform (Auth, Category, Coupon, GraphQL Gateway, Order, Product, Ticket services).

## Structure

```
e-services/
├── services/
│   ├── auth-service/
│   ├── category-service/
│   ├── coupon-service/
│   ├── graphql-gateway/
│   ├── order-service/
│   ├── product-service/
│   └── ticket-service/
└── package.json
```

## Quick Start

```bash
# Install dependencies
yarn install

# Development (all services)
yarn dev

# Development (individual service)
yarn dev:auth
yarn dev:category
yarn dev:coupon
yarn dev:gateway
yarn dev:order
yarn dev:product
yarn dev:ticket

# Build
yarn build

# Test
yarn test

# Test with coverage
yarn test:coverage
```

## Services

Each service is a standalone Node.js/Express application with its own:

- Database (MongoDB)
- Dockerfile for containerization
- Tests & test coverage
- Environment configuration

### Deployment

Each service deploys as a separate container:

- **Render** — Docker container deployment (recommended)
- **Railway** — Docker container deployment (alternative)

## Repository Secrets Required

| Secret                               | Description                                |
| ------------------------------------ | ------------------------------------------ |
| `RENDER_API_KEY`                     | Render API key for deployment              |
| `RENDER_SERVICE_ID_AUTH_SERVICE`     | Render service ID for auth-service         |
| `RENDER_SERVICE_ID_CATEGORY_SERVICE` | Render service ID for category-service     |
| `RENDER_SERVICE_ID_COUPON_SERVICE`   | Render service ID for coupon-service       |
| `RENDER_SERVICE_ID_GRAPHQL_GATEWAY`  | Render service ID for graphql-gateway      |
| `RENDER_SERVICE_ID_ORDER_SERVICE`    | Render service ID for order-service        |
| `RENDER_SERVICE_ID_PRODUCT_SERVICE`  | Render service ID for product-service      |
| `RENDER_SERVICE_ID_TICKET_SERVICE`   | Render service ID for ticket-service       |
| `RAILWAY_API_KEY`                    | Railway API key for deployment (optional)  |
| `SONAR_TOKEN`                        | SonarQube/SonarCloud token (optional)      |
| `SONAR_HOST_URL`                     | SonarQube host URL (optional, self-hosted) |
| `SONAR_ORGANIZATION`                 | SonarCloud organization key (optional)     |

## CI/CD

Automated via GitHub Actions (`.github/workflows/ci-cd.yml`):

1. **Lint, Build, Test** — runs on all branches
2. **SonarQube Scan** — code quality analysis on all branches
3. **Build & Push Docker Images** — to GitHub Container Registry (ghcr.io)
4. **Deploy to Render** — on `main` branch push (via Render API)
5. **Deploy to Railway** — on `main` branch push (configured via Railway dashboard)

### Docker Image Publishing

Images are built and pushed to:

```
ghcr.io/<org>/auth-service:main-<short-sha>
ghcr.io/<org>/category-service:main-<short-sha>
...etc
```

Access requires `GITHUB_TOKEN` (built-in GitHub Actions token).

## Testing

All services include test suites:

```bash
# Run all service tests
yarn test

# Run specific service tests
yarn test:auth
yarn test:category
yarn test:coupon
yarn test:gateway
yarn test:order
yarn test:product
yarn test:ticket

# Coverage report
yarn test:coverage
```

Coverage reports are uploaded to Codecov on each build.

## SonarQube Integration

Configure in your SonarQube instance:

```properties
sonar.projectKey=e-services
sonar.projectName=e-services
sonar.sources=services
sonar.coverage.exclusions=**/node_modules/**,**/*.spec.ts,**/*.test.ts
```

## Deployment Setup

### Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Create a new Web Service for each service
3. Connect the GitHub repository (e-services)
4. Set Docker as the build environment
5. Set the Dockerfile path: `services/<service-name>/Dockerfile`
6. Copy the Render service IDs and add them as secrets (`RENDER_SERVICE_ID_*`)

### Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Create a new project
3. Add the GitHub repository (e-services)
4. Configure services with subdirectory: `services/<service-name>`
5. Railway will auto-detect the Dockerfile and deploy

## Environment Variables

Each service reads from `.env` files:

- `.env.example` — template with all required variables
- `.env.local` — local development (git-ignored)
- `.env.production` — production settings

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp services/auth-service/.env.example services/auth-service/.env.local
```

## Database

Uses MongoDB. Configure connection string in `.env` files:

```
MONGODB_URI=mongodb://localhost:27017/ecommerce
```

## Notes

- Uses Yarn workspaces for monorepo management
- Each service has independent Dockerfile & deployment
- Shared code can be extracted to e-packages repository
- Test framework: Jest
- All services use Node.js 18+
