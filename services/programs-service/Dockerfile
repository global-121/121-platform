# # docker build -t ubuntu1604py36
# FROM ubuntu:16.04

# RUN apt-get update && apt-get install -y curl software-properties-common nano
# RUN curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
# RUN bash nodesource_setup.sh
# RUN apt-get install -y nodejs

# # copy files
# RUN mkdir --parents /home/121/
# WORKDIR /home/121/
# COPY package*.json ./
# RUN npm install
# COPY . .

# CMD [ "npm", "start" ]


FROM node:alpine

RUN mkdir --parents /home/121/
WORKDIR /home/121/

COPY package*.json ./
RUN npm clean-install
COPY . .

CMD ["npm", "run", "start:dev"]