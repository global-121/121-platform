Interfaces on the 121-platform
==============================

- [PA-App](./PA-App/)  
  (Native-)app used by *People Affected* to interact with the 121-platform.  

  Primary target(s): Mobile/Smartphone (Android/Web)

- [AW-App](./AW-App/)  
  (Native-)app used by *AidWorkers* to validate/verify PA and issue credentials.

  Primary target(s): Mobile/Smartphone (Android)

- [HO-Portal](./HO-Portal/)  
  Web-app used by the *Humanitarian Organization* to manage their programs, aid-workers, communication, etc.  

  Primary target(s): Laptop/desktop

## Development

### Environment Requirements
The tools to run or build all interfaces:

- [Git](https://git-scm.com/)

- (Optional) [NVM - Node Version Manager](http://nvm.sh/)  
  To install the required version of Node.js and to prevent conflicts between projects or components using other versions of Node.js.  
  After installing NVM run:

      nvm install && nvm install-latest-npm

- (When not using NVM) [Node.js](https://nodejs.org/) **v10+ LTS**  
  With NPM **v6.9+**

### Specific requirements
Every interface or app will have their own requirements defined in their README file.

### Backend / API
Every interface or app will refer to their specific services of APIs.

See the [/services/](../services/)-directory in this repository.


## Deployment

### Building native apps
To create 'native' versions of some of the interfaces, the following steps are required:  
Run these commands from every app's own 'root'-folder.  
(`<platform>` is `ios` or `android` or `browser`)  
(`<type>` as `--prod` or `--debug`)  

- Confirm all requirements are met for the platform of choice:

      npm run ionic -- cordova requirements <platform>

- Generate assets for the platform of choice:

      npm run ionic -- cordova resources <platform>

- Create a build:

      npm run ionic -- cordova build <platform> <type>


### Sign a production build

- Install `zipalign`
  For Ubuntu:

      sudo apt install zipalign

- Get the unsigned `apk` from the Artifacts of the Azure-pipeline or by building it locally by:

      npm run build:native -- --prod -- --release

- Get the `my-release-key.keystore` from someone who has access to it and put it in the same folder as the `apk`

- Sign the APK

      jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk alias_name

- Optimize the APK

      zipalign -v 4 app-release-unsigned.apk  <insert-app-name>.apk

- Submit the app to the Google Play Store.  
  See: <https://ionicframework.com/docs/publishing/play-store#submitting-an-app-to-the-google-play-store>
