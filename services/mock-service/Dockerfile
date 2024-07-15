FROM node:18-slim AS base

# Install curl (Used by healthchecks) and procps (Used by swc)
RUN apt-get update && apt-get install -y curl procps

WORKDIR /home/node/app

FROM base AS production

COPY ./package*.json ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

FROM base AS development

COPY . .

CMD ["npm", "run", "start:dev"]
