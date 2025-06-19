FROM node:20-slim AS base

# Install curl (Used by healthchecks) and procps (Used by swc)
RUN apt-get update && apt-get install -y curl procps

WORKDIR /home/node/app

EXPOSE ${PORT_121_SERVICE}

HEALTHCHECK \
  --start-period=60s \
  --timeout=300s \
  CMD curl --fail http://localhost:${PORT_121_SERVICE}/api/health/health || exit 1

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
