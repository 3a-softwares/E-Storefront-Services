# E-Storefront Services - Microservices Monorepo

A production-ready microservices monorepo with 7+ TypeScript/Node.js services, unified CI/CD pipeline, and comprehensive testing.

**Services**: Auth • Category • Coupon • GraphQL Gateway • Order • Product • Ticket

---

## Quick Start

### 1. Install & Test Locally

```bash
yarn install
yarn lint              # Check code quality
yarn build             # Build all services
yarn test              # Run all tests
```

### 2. Development

```bash
yarn dev              # Start all services
yarn dev:auth        # Start specific service
yarn dev:category    # (Replace with service name)
```

### 3. Configuration

Create `.env` file in each service root:

```
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017/service-name
API_KEY=xxx
API_SECRET=xxx
```

---

## All Commands Reference

### Linting & Formatting

```bash
yarn lint              # Check for linting errors
yarn lint:fix          # Auto-fix linting errors
yarn format            # Format all code files
yarn format:check      # Check formatting without changes
```

### Building

```bash
yarn build             # Build all services
yarn build:auth        # Build auth-service
yarn build:category    # Build category-service
yarn build:coupon      # Build coupon-service
yarn build:gateway     # Build graphql-gateway
yarn build:order       # Build order-service
yarn build:product     # Build product-service
yarn build:ticket      # Build ticket-service
```

### Testing

```bash
yarn test              # Run all tests
yarn test:auth         # Test specific service
yarn test:category     # (Test any service)
yarn test:coverage     # Generate coverage reports
yarn test:watch        # Watch mode
```

### Per-Service (Workspace)

```bash
yarn workspace @3asoftwares/auth-service run build
yarn workspace @3asoftwares/auth-service run test
yarn workspace @3asoftwares/auth-service run test:coverage
# Replace auth-service with: category-service, coupon-service, graphql-gateway, order-service, product-service, ticket-service
```

### Maintenance

```bash
yarn cache clean       # Clear Yarn cache
yarn outdated          # Check outdated packages
yarn upgrade           # Update dependencies
yarn upgrade-interactive  # Interactive update
```

---

## CI/CD Pipeline

### 4-Stage Pipeline

```
1️⃣ LINT        → ESLint with TypeScript (1-2 min)
2️⃣ BUILD & TEST → All 7 services parallel (3-5 min each)
3️⃣ SONARQUBE    → Code quality analysis (2-3 min)
4️⃣ DEPLOY       → Vercel (main branch only, 8-12 min)
```

**Total**: ~20-25 minutes

### Configuration Files

- `.github/workflows/ci-cd.yml` - GitHub Actions workflow (180+ lines)
- `.eslintrc.json` - ESLint configuration
- `.prettierrc.json` - Prettier code formatting
- `.eslintignore` - ESLint ignore patterns
- `sonar-project.properties` - SonarQube configuration
- `package.json` - Scripts and dependencies

### GitHub Setup

#### 1. Enable GitHub Actions

1. Go to repository **Settings** → **Actions** → **General**
2. Select "Allow all actions and reusable workflows"
3. Save changes

#### 2. Configure Branch Protection

1. **Settings** → **Branches** → **Branch protection rules** for `main`
2. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
3. Add required status checks: `lint`, `build-and-test`

#### 3. Add GitHub Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

**SonarCloud Secrets**:

- `SONAR_TOKEN` - From SonarCloud profile → My Account → Security

**Vercel Secrets**:

- `VERCEL_TOKEN` - From Vercel Dashboard → Account Settings → Tokens
- `VERCEL_ORG_ID` - From Vercel Dashboard → Team Settings (Team ID)
- `VERCEL_PROJECT_ID_AUTH_SERVICE` - From Vercel project
- `VERCEL_PROJECT_ID_CATEGORY_SERVICE` - (One per service)
- `VERCEL_PROJECT_ID_COUPON_SERVICE`
- `VERCEL_PROJECT_ID_GRAPHQL_GATEWAY`
- `VERCEL_PROJECT_ID_ORDER_SERVICE`
- `VERCEL_PROJECT_ID_PRODUCT_SERVICE`
- `VERCEL_PROJECT_ID_TICKET_SERVICE`

---

## Pre-Commit Workflow

```bash
# 1. Fix linting issues
yarn lint:fix

# 2. Format code
yarn format

# 3. Run tests locally
yarn test

# 4. Check coverage
yarn test:coverage

# 5. Build to check for errors
yarn build

# 6. Commit and push
git add .
git commit -m "feat: add new feature"
git push origin feature/branch-name
```

---

## Troubleshooting

| Issue                      | Solution                                           |
| -------------------------- | -------------------------------------------------- |
| `yarn install` fails       | `yarn cache clean && yarn install`                 |
| Lint errors persist        | `yarn lint:fix && yarn format`                     |
| Tests fail locally         | `rm -rf node_modules && yarn install && yarn test` |
| Build fails                | Check errors: `yarn build` (verify TypeScript)     |
| Port already in use (3000) | `lsof -ti:3000 \| xargs kill -9` (macOS/Linux)     |
| Git merge conflicts        | Use VSCode merge editor or `git mergetool`         |
| Cache issues               | Clear GitHub Actions cache in Settings             |

### Debug GitHub Actions

```bash
# Using GitHub CLI (https://cli.github.com/):
gh run list
gh run view <run-id>
gh run view <run-id> --log

# Enable debug logging:
# Settings → Secrets and variables → Actions
# Add: ACTIONS_STEP_DEBUG = true
```

---

## Project Information

### Monorepo Structure

```
E-Storefront-Services/
├── auth-service/           (JWT authentication, user management)
├── category-service/       (Product categories, taxonomy)
├── coupon-service/         (Discount coupons, promotions)
├── graphql-gateway/        (GraphQL API gateway, data aggregation)
├── order-service/          (Order management, order tracking)
├── product-service/        (Product catalog, inventory)
├── ticket-service/         (Support tickets, customer support)
└── packages/utils/         (Shared utilities, constants)
```

### Technology Stack

- **Language**: TypeScript 5.9.3
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **API**: GraphQL + Apollo
- **Testing**: Jest with coverage
- **Linting**: ESLint + TypeScript support
- **Formatting**: Prettier
- **Package Manager**: Yarn workspaces
- **CI/CD**: GitHub Actions
- **Code Quality**: SonarQube/SonarCloud
- **Deployment**: Vercel

### Quality Standards

```
Linting:         0 errors, 0 warnings (strict)
Type Checking:   Strict TypeScript mode
Test Coverage:   Tracked per service
Code Format:     Consistent (Prettier)
Security:        No hardcoded secrets (GitHub Secrets)
Performance:     20-25 min pipeline time
Reliability:     Non-blocking deployment
Build Time:      ~5-7 minutes
Test Time:       ~3-5 minutes
Quality Scan:    ~2-3 minutes
Deployment:      ~8-12 minutes
Success Target:  99%+ success rate
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [Vercel Documentation](https://vercel.com/docs)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [GitHub CLI](https://cli.github.com/)
- [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)

---

## Implementation Checklist

Before pushing to main:

- [ ] Run `yarn install`
- [ ] Run `yarn lint` (0 errors)
- [ ] Run `yarn build` (succeeds)
- [ ] Run `yarn test` (all pass)
- [ ] No lint errors or warnings

GitHub Configuration:

- [ ] GitHub Actions enabled
- [ ] Branch protection rules configured for main
- [ ] All GitHub Secrets added and verified

External Setup:

- [ ] SonarCloud project created
- [ ] SonarCloud token generated
- [ ] Vercel projects created (7 total)
- [ ] Vercel organization ID obtained
- [ ] Environment variables set in Vercel

First Deployment:

- [ ] Run locally: `yarn lint && yarn build && yarn test`
- [ ] Push to GitHub
- [ ] Monitor Actions tab for workflow execution
- [ ] Verify deployment to Vercel

---

## Status

✅ Configuration Complete  
✅ CI/CD Pipeline Configured  
✅ All Services Linted (0 errors)  
✅ Tests Passing  
✅ Documentation Complete

**Next Steps**: Configure GitHub Secrets and push to deploy!
