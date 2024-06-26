# Mock Service

> A stand-alone web-service/API to mock third-party API's for testing/development purposes.

## Getting started / Installation

See instructions to get started in the main [`README`](../../README.md#getting-started).

## API

- Access the Swagger UI via: <http://localhost:3001/docs/>

### Updating/adding Node.js dependencies

Make sure to update any dependencies from _within_ the Docker-container, with:

    docker compose exec mock-service  npm install --save <package-name>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
