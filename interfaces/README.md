# Interfaces on the 121-platform

- [PA-App](./PA-App/)  
  Web-app used by _People Affected_ to interact with the 121-platform.

  Primary target(s): Mobile/Smartphone

- [AW-App](./AW-App/)  
  Web-app used by _AidWorkers_ to validate PAs.

  Primary target(s): Mobile/Smartphone

- [Portal](./Portal/)  
  Web-app used by the _Humanitarian Organization_ to manage their programs, aid-workers, communication, etc.

  Primary target(s): Laptop/desktop

## Documentation

Every interface or app has their own set of features described in test-scenarios.

See the [/features/](../features/)-directory in this repository.

## Development

### Offline features

For some 'offline' features it is required to run them in a specific way (i.e. to enable their service-worker) locally.  
See the related Angular-documentation: <https://v15.angular.io/guide/service-worker-getting-started#serving-with-http-server>

To use it locally:

- Run: `npm run start:debug-production` instead of `npm start` (in each interfaces' specific folder).
- This part is needed extra for the cookies to be correctly set and processed:
  - In Chrome
    - Go to `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
      - Enable it
      - Add "`http://127.0.0.1`"
      - Relaunch
    - Change the values back to normal when switching to the normal local mode again
  - Unfortunately no alternative for the below in other browsers have been identified at the moment
- The interface will be available at: <http://localhost:8088/>.
- Check the service-worker's status via: `Developer Tools > Application > Service Workers`.

### Specific requirements

Every interface or app has their own requirements defined in their README file.

### Backend / API

Every interface or app will refer to the specific services or APIs they require.

See the [/services/](../services/)-directory in this repository.

### Dependencies in use

All interfaces use a common set of dependencies/frameworks/libraries.

- [Ionic v7](https://ionicframework.com/docs/)  
  This UI-kit or library gives us a foundation to quickly build interfaces cross-platform and cross-device-type(mobile/desktop).  
  We use the (default) framework of Angular with(in) Ionic.

  - Available components: <https://ionicframework.com/docs/components>
  - CSS Utilities: <https://ionicframework.com/docs/layout/css-utilities>
  - Icons: <https://ionicons.com/>

- [Angular v16+](https://v16.angular.io/docs)  
  This front-end framework gives us a structure to create components that can be connected, combined, share data and can be delivered as a web-app.

  - API Documentation: <https://v16.angular.io/api>
  - Used by Angular, RxJS: <https://rxjs.dev/api>

- [`ngx-translate` v14](https://www.npmjs.com/package/@ngx-translate/core/v/14.0.0)  
  An Angular-service to handle internationalization(i18n) or translations.

  - Website: <http://www.ngx-translate.com/>
  - API Documentation: <https://github.com/ngx-translate/core/tree/v12.1.2#api>

- [`ngx-translate-lint` v1.20.7](https://www.npmjs.com/package/ngx-translate-lint/v/1.20.7)  
   A lint-tool to check for missing or unused translations or typos in keys.

  - GitHub: <https://github.com/svoboda-rabstvo/ngx-translate-lint/tree/v1.20.7#readme>

### Updating dependencies

Most (development-)dependencies in this repository are monitored by the GitHub [Dependabot](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates) service, to keep them up-to-date.  
The configuration of these updates is in [`.github/dependabot.yml`](../.github/dependabot.yml).  
Unfortunately most individual dependencies are 'linked' to related dependencies that need to stay 'in sync'.

To update all Angular and ESLint related dependencies together, run (in each individual interface's directory):

    npm run upgrade:angular

All related changes will be handled by the Angular CLI, but need to be checked afterwards with `lint`, `test` commands.

### Continuous Integration (CI)

Every interface has their own Azure Pipeline set up to run tests and generate 'builds'.  
See their status on the [main README](../README.md#status).

The appropriate tests will run automatically when relevant files are changed in a PR.

## Deployment

### Building for production

To generate a 'production ready' build of an interface, some environment-variables need to be set.
The convention by [`dotenv`](https://www.npmjs.com/package/dotenv) is used.

Possible variables are available in `.env.example` files for each interface. Make a local copy to set them:

    cp .env.example .env

When creating a production build, they are automatically used and inserted into the build.
