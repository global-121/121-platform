PA-App
======

The front-end of the application *People Affected* use to interact with the 121-platform.

## Getting Started
- Install [environment requirements](../README.md)
- Install dependencies (from this folder):

      npm install

- Start in development-mode:

      npm start

- or: Run on an Android-device:

      npm run dev:on-device

For more options, see the documentation of the [Ionic/Cordova CLI](https://ionicframework.com/docs/cli/commands/cordova-run).


## Configuration
Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.


## Dependencies in use
Next to the 'generic' dependencies/libraries/components [used by all interfaces](../README.md#Dependencies-in-use), the PA-app also uses:

- [`angularx-qrcode`](https://github.com/cordobo/angularx-qrcode)
  A component to render QR-codes with custom data.
  - Documentation: <https://github.com/cordobo/angularx-qrcode#basic-usage>


## Deployment / Building
To deploy a native build of this app, see the generic instructions in [/interfaces/README](../README.md#Deployment).

After that, run: (with `<type>` as `--prod` or `--debug`)

    npm run build:native -- <type>

