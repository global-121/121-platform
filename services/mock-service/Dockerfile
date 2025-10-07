FROM node:20-slim AS base

# Install curl (Used by healthchecks) and procps (Used by swc)
RUN apt-get update --no-install-recommends && apt-get install -y curl procps

WORKDIR /home/node/app

# This exposed port is technically not the same as the published port using Compose (we use the same number for simplicity)
EXPOSE ${PORT_MOCK_SERVICE}

HEALTHCHECK \
  --interval=15s \
  --retries=15 \
  --start-period=60s \
  --timeout=300s \
  CMD curl --fail http://0.0.0.0:${PORT_MOCK_SERVICE}/api/instance/version || exit 1

FROM base AS production

COPY ./package*.json ./
COPY ./.npmrc ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

FROM base AS development

COPY . .

CMD ["npm", "run", "start:dev"]
