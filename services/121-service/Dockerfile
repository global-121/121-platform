FROM node:18-slim as base

# Install curl (Used by healthchecks) and procps (Used by swc)
RUN apt-get update && apt-get install -y curl procps

WORKDIR /home/node/app

FROM base as production

COPY ./package*.json ./
COPY ./.npmrc ./

RUN npm ci

COPY . .

RUN npm run build

CMD ["npm", "start"]

FROM base as development

COPY . .

# Starting the node process happens in docker-compose-development.yml
