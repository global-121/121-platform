
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

ADD . /workspace

RUN cd /workspace && npm install && npm test
