# UserIMS

This is the web services that exposes the API for operations on Hyperledger Indy that application users 
will need. It can be considered as web proxy to Indy SDK. It manages user's wallet and performs regular
Indy actions on their behalf

## Set up the project

This steps assume clean installation of Ubuntu 16.04

Steps:
1. Installing libindy:
    1. sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 68DB5E88
    2. sudo add-apt-repository "deb https://repo.sovrin.org/sdk/deb xenial stable"
    3. sudo apt-get update
    4. sudo apt-get install -y libindy
    
2. Download Indy-SDK:
    1. git clone https://www.github.com/hyperledger/indy-sdk
    
3. Starting local Indy network
    1. go to the indy-sdk folder
    2. docker network create --subnet 10.0.0.0/8 indy_pool_network
    3. docker build --build-arg pool_ip=10.0.0.2 -f ci/indy-pool.dockerfile -t indy_pool .
    4. docker run -d --ip="10.0.0.2" --net=indy_pool_network indy_pool

4. Running the service
    1. install Python 3.6 and virtualenvwrapper package (https://virtualenvwrapper.readthedocs.io/en/latest/)
    2. mkvirtualenv -p python3.6 USERIMS
    3. workon USERIMS
    4. change to the project directory
    5. python setup.py develop
    6. make sure config.json is updated properly
    7. python start.py

    docker build --rm -f "Dockerfile" -t userims:latest .
    docker run --net=indy_pool_network -p 0.0.0.0:50003:50003 userims:latest