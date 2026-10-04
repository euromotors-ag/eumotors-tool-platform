FROM node:22.12-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.12-slim AS runner
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/dist ./dist
COPY package*.json ./

# Install runtime dependencies only (Playwright will install browsers via postinstall)
RUN npm ci --omit=dev

ENV PLAYWRIGHT_HEADLESS=1
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD \
  curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
