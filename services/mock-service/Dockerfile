FROM node:24-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends curl procps && rm -rf /var/lib/apt/lists/*

WORKDIR /home/app

EXPOSE ${PORT_MOCK_SERVICE}

HEALTHCHECK \
  --interval=15s \
  --retries=15 \
  --start-period=60s \
  --timeout=300s \
  CMD curl --fail http://0.0.0.0:${PORT_MOCK_SERVICE}/api/instance/version || exit 1

# --- Dependency layer (cacheable) ---
COPY package.json package-lock.json .npmrc ./
COPY packages/eslint-config-121-platform/package.json packages/eslint-config-121-platform/
COPY services/mock-service/package.json services/mock-service/

RUN npm ci --workspace=mock-service --include-workspace-root=false

# --- Source layer ---
COPY packages/eslint-config-121-platform packages/eslint-config-121-platform
COPY services/mock-service services/mock-service

WORKDIR /home/app/services/mock-service

FROM base AS production

RUN npm run build -w mock-service
CMD ["npm", "start", "-w", "mock-service"]

FROM base AS development

CMD ["npm", "run", "start:dev", "-w", "mock-service"]
