# <p align="center"> API & E2E testing suites </p>

<p align="center">
  <a href="https://playwright.dev/">
    <img width="140" alt="Playwright Logo" src="https://seeklogo.com/images/P/playwright-logo-22FA8B9E63-seeklogo.com.png" />
    </a>
</p>

<p align="center">
  This documentation touches upon E2E Playwright test suite for API refer to [`/features`](features/#readme). 
</p>

## Advantages of Playwright Automated Tests

- **Simulating User Interactions**: Playwright enables you to simulate user interactions in the interface across different browsers and devices.

- **Reuse of API Tests**: With Playwright, you can reuse API tests and include parts of those tests in the setup of front-end automation.

- **Automation of UI Regression Tests**: While UI regression tests are typically done manually, Playwright allows you to automate these repeatable tasks efficiently.

- **Headless Testing on Pipelines**: Playwright supports headless testing, making it suitable for integration with CI/CD pipelines.

- **Rich APIs and Debugging Capabilities**: Playwright offers a rich collection of APIs for writing tests and extensive debugging capabilities, including screenshots, videos, and trace logs.



> 🚩 **Note**

### Installation

Clone the repository and run the command:

```shell
npm install
```

> 🚩 **Note**
>
> The only prerequisite is to have Node.js, Plawyright and Playwright Add On for VS Code installed on your machine

### Run test via console

```shell
npx playwright test
```

### Or run them using built in runner via VS Code

> 🚩 **Note**
> This project is for sheer purpose of presenting Playwright possibilities.

## License

[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/cypress-io/cypress/blob/master/LICENSE)

This project is licensed under the terms of the [MIT license](/LICENSE).


