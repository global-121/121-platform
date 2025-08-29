# Interfaces on the 121-platform

- [Portal](./portal/)
  Web-app used by the _Humanitarian Organization_ to manage their projects, aid-workers, communication, etc.

  Primary target(s): Laptop/desktop

## Documentation

Every interface or app has their own set of features described in test-scenarios.

See the [/features/](../features/)-directory in this repository.

## Development

### Specific requirements

Every interface or app has their own requirements defined in their `README`-file.

### Backend / API

Every interface or app will refer to the specific services or APIs they require.

See the [/services/](../services/)-directory in this repository.

### Continuous Integration (CI)

Every interface has their own GitHub Actions-workflows set up to run tests and generate 'builds'.  
See their status on the [main README](../README.md#status).

The appropriate tests will run automatically when relevant files are changed in a PR.

## Deployment

### Server-side configuration

Hosting the interfaces has some requirements. The basics are covered by Angular's requirements: <https://angular.io/guide/deployment#server-configuration>

The configuration for using Azure Static Web Apps is done in each interface's [`staticwebapp.config.json`] file.  
These default settings will apply to all environments when deployed.

Depending on the required/preferred features of the 121-platform instance, some settings can/have to be overridden per-environment by the [deployment workflow](../.github/actions/build-interface/action.yml). The possible customizations are listed under the "`inputs:`"-section.

#### Instance Icon / `favicon.ico`

Each interface can show to which instance it belongs using an icon. This file will be created during [the build-step in the deployment workflow](../.github/actions/build-interface/action.yml#L64).

A Base64-encoded string should be provided to the `envIcon`-parameter.  
This string can be generated from an `.ico`-file (For example via: <https://rodekruis.github.io/browser-tools/image-to-data-url/>.)

#### Content Security Policy (CSP)

To protect users against malicious injected scripts and attacks, a [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) should be applied. This will limit the sources of code that get loaded/executed in the interface to the ones that are explicitly defined/trusted.

This is related to some features of the 121-platform, so some settings will only apply when really in use/necessary.
The default/generic values are defined at: [`build-interface/action.yml#L17`](../.github/actions/build-interface/action.yml)

For each different interface, on each specific instance, other settings apply, depending on their (required) functionality.

Following the configuration of the 121 Demo environment, the following CSP is set in: [`workflows/deploy_client-demo_portal.yml`](../.github/workflows/deploy_client-demo_portal.yml#L34):

- `connect-src` and `form-action`:  
  Allows the hostname to make API-requests to. (i.e. `https://<instance-name>.121.global`), but also third-parties like Application-Insights.
  - When SSO using Azure Entra will be used, `https://login.microsoftonline.com` should be included..
- `frame-src`:  
  Allows the sources that can be shown in an `<iframe>`.
  - When the FSP `Intersolve-voucher` will be used, `blob: 'self'` should be included.
  - When any PowerBI-dashboard will be used, `https://app.powerbi.com` should be included.
  - When SSO using Azure Entra will be used, `https://login.microsoftonline.com` should be included..
- `frame-ancestors`:  
  Allows an interface to be included in an `<iframe>` on some other web-site or -service.

  When the integration with Twilio Flex will be used, `https://flex.twilio.com` should be included.

  ##### Testing Twilio Flex integration

  Some aspects of the Twilio Flex integration can be simulated/mocked (locally) by injecting an `<iframe>` into a page on the Twilio Flex website.
  1. Go to <https://flex.twilio.com/>
  2. Without being logged in, open the browser's developer tools (F12 or ⌘+⇧+I) or console. Paste and run the following code:

     ```js
     // Set the hostname of the 121-portal-instance;
     // For example: 'https://<instance-name>.121.global/portal/' or 'https://portal.<instance-name>.121.global/'
     const instancePortalHostname = 'http://localhost:4200/';

     document.querySelector('.Twilio-LoginFormView-Container').innerHTML =
       `<iframe id="redline" src="${instancePortalHostname}/iframe/recipient?phonenumber=1234567890" width="480" height="800" style="width:100%"></iframe>`;
     ```

  3. To trigger a page-change/load (as if done by Twilio), run the following code:

     ```js
     document.getElementById('redline').src =
       `${instancePortalHostname}/iframe/recipient?phonenumber=1234567890`;
     ```

     Or without the `phonenumber`-parameter, to simulate a 'clean' starting point.
