<!-- markdownlint-disable MD033 -->

# <p align="center"> K6 performance testing suite </p>

<!-- markdownlint-disable MD033 -->

<p align="center">
  <a href="https://k6.io/docs/">
    <img width="140" alt="K6 Logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/K6-load-testing-tool-logo.svg/2105px-K6-load-testing-tool-logo.svg.png" />
  </a>
</p>

**<p align="center">
This documentation is still work in progress. Few main things that it touches upon is brief explanation of what is "K6", how to run it locally and where to set up tests to run on CI.**

</p>

# <p align="center"> What is K6? </p>

**K6 is an open-source load testing tool and framework designed for testing the performance of APIs, microservices, and websites. Developed by Grafana Labs,
K6 allows developers and QA engineers to create and run performance tests using JavaScript.**

## Key Features

- **Scriptable in JavaScript**: Write test scripts in JavaScript.
- **CLI Tool**: Run tests from the command line, easily integrating into CI/CD pipelines.
- **Performance Testing**: Designed to test the performance and reliability of web applications under varying loads.
- **Thresholds and Checks**: Define performance thresholds and checks to validate the performance and correctness of your system.
- **Scalable**: Simulate thousands of virtual users to generate load on your application.
- **Extensible**: Supports plugins and can be extended with custom functionality.
- **Results Analysis**: Provides detailed metrics and results that can be integrated with other tools for further analysis.

# <p align="center"> How to run it locally? </p>

First you must [install k6](https://k6.io/docs/get-started/installation/). (For mac users, the easiest way is with `brew install k6`)

**Install K6 dependecies:**

```shell
cd /k6
```

Then:

```shell
npm install
```

**To run the tests:**

```shell
cd /k6
```

Then:

```shell
npm run test -- tests/<name of the test>.js
```

**The results of the tests will be then displayed in your terminal.**

# <p align="center"> Where can we select tests for run in CI? </p>

**To view .yml file navigate:**

```shell
code /.github/workflows/test_k6.yml
```

**And edit current setup or add more tests to run. Keep in mind that load tests tend to be much "heavier" to execute then API integration tests:**

```shell
- name: Run k6 tests
  working-directory: ${{ env.k6TestsPath }}
  run: |
    npx dotenv -e ../services/.env -- ./k6 run tests/pvProgramPerformance.js
```
