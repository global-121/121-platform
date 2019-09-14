##  Install pwgen
apt install pwgen

## Install Indy-cli
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 68DB5E88
apt-get install -y software-properties-common python-software-properties
add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial stable"
add-apt-repository "deb https://repo.sovrin.org/deb xenial stable"
apt-get update -y
apt-get upgrade -y
apt-get install -y --allow-unauthenticated indy-cli