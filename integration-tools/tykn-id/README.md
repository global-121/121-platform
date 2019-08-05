## How to run on Ubuntu
Make sure you have [Indy-sdk](https://github.com/hyperledger/indy-sdk#ubuntu-based-distributions-ubuntu-1604) installed
Or else use the script `ubuntu-installer.sh` to setup the developer environment.

### Tests
Goto the code directory and run
`npm install`
`npm test`

#### Running tests in docker

- Install docker.
- run `docker build --rm -f "Dockerfile" -t tykn-id:latest .`