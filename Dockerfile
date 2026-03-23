# ═══════════════════════════════════════════════════════════════════════════════
# Vedi EHR Frontend — Production Dockerfile
# Multi-stage build: deps → build → slim runtime
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# ── Stage 2: Build ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time env vars
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_SENTRY_DISABLED="true"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""

RUN npm run build

# ── Stage 3: Runtime ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
