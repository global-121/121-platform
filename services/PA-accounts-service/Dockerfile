FROM ubuntu:16.04

ARG uid=1000
RUN apt-get update && \
  apt-get install -y \
  curl \
  build-essential \
  pkg-config \
  cmake \
  libssl-dev \
  libsqlite3-dev \
  libzmq3-dev \
  libncursesw5-dev \
  software-properties-common \
  apt-transport-https

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

RUN mkdir --parents /home/121/services/PA-accounts-service/
WORKDIR /home/121/services/PA-accounts-service/

COPY package*.json ./
RUN npm ci

# Regular:
CMD ["npm", "start"]
