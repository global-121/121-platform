FROM ubuntu:16.04
RUN apt-get update && apt-get install \
  -y --no-install-recommends git \
        software-properties-common \
        apt-transport-https \
        wget

RUN add-apt-repository ppa:deadsnakes/ppa
RUN apt-get update
RUN apt-get install -y python3.6
RUN apt-get install -y python3-virtualenv

RUN apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CE7709D068DB5E88
RUN add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial stable"
RUN apt-get update && apt-get install -y libindy=1.9.0

ENV VIRTUAL_ENV=/opt/venv
RUN python3.6 --version
RUN python3.6 -m virtualenv --python=/usr/bin/python3.6 $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

ADD . .
# Install dependencies:
RUN pip install -e .

# Define config-file per HO
ARG CONFIG
ENV CONFIG=${CONFIG}

# Run the application:
CMD python3.6 start.py -c ${CONFIG}