sudo apt-get update && \
sudo apt-get install -y \
   build-essential \
   pkg-config \
   cmake \
   libssl-dev \
   libsqlite3-dev \
   libzmq3-dev \
   libncursesw5-dev

cd /tmp && \
  curl https://download.libsodium.org/libsodium/releases/old/libsodium-1.0.14.tar.gz | tar -xz && \
   cd /tmp/libsodium-1.0.14 && \
   ./configure --disable-shared && \
   make && \
   make install && \
   rm -rf /tmp/libsodium-1.0.14

sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 68DB5E88
sudo add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial {release channel}"
sudo apt-get update
sudo apt-get install -y libindy