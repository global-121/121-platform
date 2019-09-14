sudo apt-get update && \
sudo apt-get install -y \
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

sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys CE7709D068DB5E88
sudo add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial stable"
sudo apt-get update && apt-get install -y libindy

