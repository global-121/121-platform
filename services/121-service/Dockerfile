FROM node:20-slim AS base

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

FROM base AS production

# Include centrally shared, vendored resources
COPY ./vendor/ ./vendor/

# Prepare dependencies install-step
COPY ./package*.json ./
COPY ./.npmrc ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

FROM base AS development

COPY . .

CMD ["npm", "run", "start:dev"]
