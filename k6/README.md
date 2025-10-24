> [!NOTE]
> K6 tests have been reduced to a single test that requires its own isolated environment.
> Full load tests have been removed entirely, along with their associated workflow.

# K6 Performance Testing Suite

> See: <https://k6.io/docs/>

---

> **Note:** This documentation covers: what K6 is, how to run it locally, and where to configure the Github Action workflow.

## What is K6?

**K6 is an open-source load testing tool and framework designed for testing the performance of APIs, microservices, and websites. Developed by Grafana Labs, K6 allows developers and QA engineers to create and run performance tests using JavaScript.**

### Key Features

- **Scriptable in JavaScript**: Write test scripts in JavaScript
- **CLI Tool**: Run tests from the command line, easily integrating into CI/CD pipelines
- **Performance Testing**: Designed to test the performance and reliability of web applications under varying loads
- **Thresholds and Checks**: Define performance thresholds and checks to validate the performance and correctness of your system
- **Scalable**: Simulate thousands of virtual users to generate load on your application
- **Extensible**: Supports plugins and can be extended with custom functionality
- **Results Analysis**: Provides detailed metrics and results that can be integrated with other tools for further analysis

## How to Run It Locally

### Prerequisites

First, you must [install K6](https://k6.io/docs/get-started/installation/). For macOS users, the easiest way is:

```shell
brew install k6
```

### Setup

1. **Install K6 dependencies:**

```shell
   cd /k6
   npm install
```

2. **Set environment variable:**
   Make sure the `EXTERNAL_121_SERVICE_URL` environment variable is set to `http://localhost:3000` (not to an `ngrok` address).

### Configuration

#### Update baseUrl

Since CI tests use a differently composed baseUrl, you may encounter extra slashes in your API calls when running locally. If this happens, remove the extra `+` and `'/'` from baseUrl in `.k6/models/config.js`.

**Change from:**

```javascript
baseUrl: __ENV.EXTERNAL_121_SERVICE_URL + '/' || 'http://localhost:3000/',
```

**To:**

```javascript
baseUrl: __ENV.EXTERNAL_121_SERVICE_URL || 'http://localhost:3000/',
```

### Running the Test

```shell
cd /k6
npm run test -- tests/BulkUpdate32kRegistration.js
```

## CI Configuration

The test is configured in:

- [`.github/workflows/test_k6.yml`](../.github/workflows/test_k6.yml)

The workflow runs the `BulkUpdate32kRegistration.js` test with `DUPLICATE_NUMBER=3` for faster execution:

```yaml
- name: Run BulkUpdate32kRegistration.js with DUPLICATE_NUMBER=3
  working-directory: ${{ env.k6TestsPath }}
  run: |
    DUPLICATE_NUMBER=3 npx dotenv -e ../services/.env -- ./k6 run tests/BulkUpdate32kRegistration.js
```
