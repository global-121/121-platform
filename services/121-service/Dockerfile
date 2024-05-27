FROM node:18-slim as base

# Used by healthchecks
RUN apt-get update && apt-get install curl -y

WORKDIR /home/node/app

FROM base as production

COPY ./package*.json ./
COPY ./.npmrc ./

RUN npm ci

COPY . .

CMD ["npm", "start"]

FROM base as development

COPY . .

# Starting the node process happens in docker-compose-development.yml
