FROM node:18-slim as base

# Used by healthchecks
RUN apt-get update && apt-get install curl -y

COPY . /home/node/app/

WORKDIR /home/node/app/mock-service

FROM base as production

WORKDIR /home/node/app/121-service

RUN npm ci

WORKDIR /home/node/app/mock-service

RUN npm ci

CMD ["npm", "start"]

FROM base as development

WORKDIR /home/node/app/mock-service

CMD ["npm", "run", "start:dev"]
