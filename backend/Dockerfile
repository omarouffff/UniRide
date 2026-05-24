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

# Dummy URLs for `prisma generate` only (runtime uses Railway env)
ENV DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
ENV DIRECT_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

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
  && chmod +x /app/scripts/docker-entrypoint.sh \
  && chmod +x /app/scripts/run-migrations.js \
  && chown -R nodejs:nodejs /app

USER nodejs

ENV PORT=5000
EXPOSE 5000

# Liveness: HTTP server responds (DB may still be connecting; Railway uses railway.toml healthcheck too)
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 5000) + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

CMD ["/app/scripts/docker-entrypoint.sh"]
