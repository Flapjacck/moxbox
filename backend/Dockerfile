# Build stage
FROM node:22-alpine AS builder

# Install build dependencies for native modules (better-sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:22-alpine

# Install runtime dependencies for native modules
RUN apk add --no-cache libstdc++

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and production dependencies only
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create data directory structure
RUN mkdir -p /app/data/files

# Expose backend port
EXPOSE 4200

# Set environment variables defaults (can be overridden by docker-compose)
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4200 \
    DATABASE_PATH=/app/data/db.sqlite \
    FILES_DIR=/app/data/files

# Start the application
CMD ["node", "dist/index.js"]
