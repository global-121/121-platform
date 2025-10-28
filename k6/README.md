# K6 Testing Suite

> See: <https://k6.io/docs/>

---

> **Note:** This documentation covers what K6 is, why we use it, how to run it locally, and where to configure the Github Action workflow.

## What is K6?

**K6 is an open-source testing tool and framework developed by Grafana Labs. While primarily designed for load testing, we use it for its ability to create isolated test environments with external process control.**

### Why We Use K6

We maintain a single K6 test that requires an isolated testing environment where we can control external services independently. Specifically, this allows us to:

- Test scenarios that require killing or restarting services (e.g., the 121-service) during test execution
- Simulate real-world failure conditions that cannot be easily replicated in standard unit or integration tests
- Validate service recovery and retry mechanisms, such as ensuring failed jobs are properly retried after service restart

> **Note:** We do not currently use K6 for performance or load testing. The use of K6 was minimised to single test and performance/load tests were moved to Jest.

## Current Test

### `retryFailedJobsOnStartupDuringQueueProcessing.js`

This test validates that the system correctly retries failed jobs when the service restarts during queue processing:

1. Resets the database with mock registrations
2. Creates a payment that adds jobs to the queue
3. Kills the 121-service while jobs are being processed
4. Waits for the service to restart
5. Monitors that all payments complete successfully after the restart

This ensures the job queue recovery mechanism works correctly in failure scenarios.

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

Since CI tests use a differently composed baseUrl, you may encounter extra slashes in your API calls when running locally. If this happens, remove the extra `+` and `'/'` from baseUrl in `./k6/models/config.js`.

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
npm run test -- tests/retryFailedJobsOnStartupDuringQueueProcessing.js
```

## CI Configuration

The test is configured in:

- [`.github/workflows/test_k6.yml`](../.github/workflows/test_k6.yml)

```yaml
- name: Run retryFailedJobsOnStartupDuringQueueProcessing.js
  working-directory: ${{ env.k6TestsPath }}
  run: |
    npx dotenv -e ../services/.env -- ./k6 run tests/retryFailedJobsOnStartupDuringQueueProcessing.js
```
