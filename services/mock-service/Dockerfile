FROM node:18-slim as base

WORKDIR /home/node/app

FROM base as production

COPY ./package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]

FROM base as development

COPY . .

CMD ["npm", "run", "start:dev"]
