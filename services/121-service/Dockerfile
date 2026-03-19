FROM node:24-slim AS base

# Install curl (Used by healthchecks) and procps (Used by swc)
RUN apt-get update && apt-get install -y --no-install-recommends curl procps && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

# This exposed port is technically not the same as the published port using Compose (we use the same number for simplicity)
EXPOSE ${PORT_121_SERVICE}

HEALTHCHECK \
  --interval=15s \
  --retries=15 \
  --start-period=60s \
  --timeout=300s \
  CMD curl --fail http://0.0.0.0:${PORT_121_SERVICE}/api/health/health || exit 1

# Include source-code of shared packages
COPY packages /home/packages

# Include source-code of the service itself
COPY services/121-service /home/node/app

FROM base AS production

RUN npm ci

RUN npm run build

CMD ["npm", "start"]

FROM base AS development

CMD ["npm", "run", "start:dev"]
