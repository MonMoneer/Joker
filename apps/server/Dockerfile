FROM node:20-slim AS base
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/engine/package.json packages/engine/
COPY apps/server/package.json apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source
COPY packages/engine/ packages/engine/
COPY apps/server/ apps/server/

# Build
RUN pnpm --filter @joker/server build

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "apps/server/dist/index.js"]
