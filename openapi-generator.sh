# Before running this:
# - Make sure you have Docker installed
# - Make sure the 121-service is running at http://localhost:3000

# Download the OpenAPI (Swagger) spec in json format from the 121-service
curl http://localhost:3000/docs-json > 121-service-docs.json

# Generate the Angular API
docker run --rm \
  -v ${PWD}:/local openapitools/openapi-generator-cli generate \
  -i /local/121-service-docs.json \
  -g typescript-angular \
  -o /local/121-service-angular-api \
  -c /local/openapi-generator.config.json \
  --skip-validate-spec

# Build the Angular API
cd 121-service-angular-api
npm install
npm run build

# Install the Angular API in the Portal
cd ../interfaces/Portal
npm install ../../121-service-angular-api/dist
