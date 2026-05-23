# syntax=docker/dockerfile:1
# Build context: backend/  |  Railway Root Directory: backend

# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy schema BEFORE npm ci (fixes "Could not find Prisma Schema")
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ==========================================
# Stage 2: Runtime
# ==========================================
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# No postinstall prisma generate — client copied from builder
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Application source from build context (Express — no dist/)
COPY . .

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001 -G nodejs \
  && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
