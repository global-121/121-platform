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


RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CE7709D068DB5E88
RUN add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial stable"
RUN apt-get update && apt-get install -y libindy


RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs


RUN mkdir --parents /home/121/services/121-service/
WORKDIR /home/121/services/121-service/

COPY package*.json ./
RUN npm ci

# HO wallet+DID import
COPY secrets/ secrets/
RUN cd "secrets/DID generation/" && chmod +x setup_env.sh
RUN cd "secrets/DID generation/" && ./setup_env.sh
RUN cd "secrets/DID generation/" && indy-cli import-HO-wallet.txt

#CMD ["npm", "run", "test:watch"]
#CMD ["npm", "run", "start:dev"]


