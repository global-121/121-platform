FROM node:18-slim as base

# Used by healthchecks
RUN apt-get update && apt-get install curl -y

WORKDIR /home/node/app/mock-service

FROM base as production

COPY ./package*.json ./

RUN npm ci

CMD ["npm", "start"]

FROM base as development

CMD ["npm", "run", "start:dev"]
