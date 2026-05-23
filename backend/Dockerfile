# syntax=docker/dockerfile:1

# --- Stage 1: install deps + generate Prisma Client ---
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma engines need OpenSSL on Alpine
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

# Full install (includes prisma CLI in devDependencies)
RUN npm ci

RUN npx prisma generate

# --- Stage 2: production runtime ---
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./

# Skip postinstall (prisma generate) — client already built in builder stage
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Application source (server, routes, controllers, etc.)
COPY . .

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs \
  && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Migrations then start (requires DATABASE_URL in Railway)
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
