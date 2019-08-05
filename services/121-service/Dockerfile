FROM node:alpine

RUN mkdir --parents /home/121/
WORKDIR /home/121/

COPY package*.json ./
RUN npm clean-install
COPY . .

#CMD ["npm", "run", "test:watch"]
CMD ["npm", "run", "start:dev"]
