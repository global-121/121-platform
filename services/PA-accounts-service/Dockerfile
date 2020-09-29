FROM node:10.22-alpine

WORKDIR /home/node/app

COPY ./package*.json ./

RUN npm ci

COPY . .

CMD ["npm", "start"]
