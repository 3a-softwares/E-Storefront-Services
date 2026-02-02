# Production Dockerfile for GraphQL Gateway
# Uses @3asoftwares packages from npm registry

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/graphql-gateway/package.json ./
COPY services/graphql-gateway/tsconfig.json ./

# Install dependencies (gets @3asoftwares packages from npm)
RUN npm install

# Copy source and build
COPY services/graphql-gateway/src ./src
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built files and package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install production dependencies only
RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
