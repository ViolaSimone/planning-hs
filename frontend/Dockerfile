# =============================================================================
# Base stage: shared dependency installation
# =============================================================================
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./

RUN npm install

# =============================================================================
# Dev stage: used for local development and everyday "docker compose up"
# =============================================================================
FROM base AS dev

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# =============================================================================
# Builder stage: compiles the production build
# =============================================================================
FROM base AS builder

COPY . .

ENV NODE_ENV=production

RUN npm run build

# =============================================================================
# Runner stage: minimal production image
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]