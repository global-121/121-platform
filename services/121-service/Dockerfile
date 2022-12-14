FROM node:16-slim as base

WORKDIR /home/node/app

FROM base as production

COPY ./package*.json ./

RUN npm ci --only=production

COPY . .

USER node

CMD ["npm", "start"]


FROM base as development

COPY . .

USER root

CMD ["npm", "run", "start:dev"]
