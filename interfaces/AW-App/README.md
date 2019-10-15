AW-App
======

The front-end of the application an *Aid-Worker* uses to interact with the 121-platform.

## Getting Started
- Install [environment requirements](../README.md)
- Install dependencies (from this folder):

      npm install

- Start in development-mode:

      npm start

- or: Run the app and use the camera (in a local browser):

      npm run dev:local

- or: Run on an Android-device:

      npm run dev:on-device

For more options, see the documentation of the [Ionic/Cordova CLI](https://ionicframework.com/docs/cli/commands/cordova-run).


## Configuration
Some specific information need to be configured before use:

- Set the API-endpoint(s) in the [`environment.ts`](./src/environments/environment.ts)-file.


## Deployment / Building
To deploy a native build of this app, see the generic instructions in [/interfaces/README](../README.md#Deployment).

After that, run: (with `<type>` as `--prod` or `--debug`)

    npm run build:native -- <type>


## Sign production build

- Install zipalign 

      sudo apt install zipalign

- Get the unsigned apk from the Artifacts from the AW-App-Build pipeline or by building it locally using
platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk 

      npm run build:native -- --prod -- --release

- Get the `my-release-key.keystore` from someone who has access to it and put it in the same folder as the apk

- Sign the apk 

      jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk alias_name

- Optimize the APK 

      zipalign -v 4 app-release-unsigned.apk  Aidworker-121.apk

- TODO: Submit the app to the google play store. Reference https://ionicframework.com/docs/publishing/play-store#submitting-an-app-to-the-google-play-store 
