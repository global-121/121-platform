# TyknIMS
Tykn Indy Management Service 

## How to run in docker
docker build --rm -f "Dockerfile" -t tyknims:latest .
docker run --net=indy_pool_network -p 0.0.0.0:50001:50001 tyknims:latest