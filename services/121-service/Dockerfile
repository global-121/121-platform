FROM node:24-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends curl procps && rm -rf /var/lib/apt/lists/*

WORKDIR /home/app

EXPOSE ${PORT_121_SERVICE}

HEALTHCHECK \
  --interval=15s \
  --retries=15 \
  --start-period=60s \
  --timeout=300s \
  CMD curl --fail http://0.0.0.0:${PORT_121_SERVICE}/api/health/health || exit 1

# --- Dependency layer (cacheable) ---
COPY package.json package-lock.json .npmrc ./
COPY packages/eslint-config-121-platform/package.json packages/eslint-config-121-platform/
COPY services/121-service/package.json services/121-service/

RUN npm ci --workspace=121-service --include-workspace-root=false

# --- Source layer ---
COPY packages/eslint-config-121-platform packages/eslint-config-121-platform
COPY services/121-service services/121-service

WORKDIR /home/app/services/121-service

FROM base AS production

RUN npm run build -w 121-service
CMD ["npm", "start", "-w", "121-service"]

FROM base AS development

CMD ["npm", "run", "start:dev", "-w", "121-service"]
