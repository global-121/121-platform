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

- [Referral-App](./Referral-App/)
  (Native-)app used by *People Affected* to lookup useful organizations.

  Primary target(s): Mobile/Smartphone (Android/Web)

## Documentation
Every interface or app has their own set of features described in test-scenarios.

See the [/features/](../features/)-directory in this repository.


## Development

### Native environments
#### Android
When testing/debugging on Android and using the '`livereload`' functionality, it is required to add the following security exception in the app's `config.xml`, by adding the `<edit-config>`-block into the `<platform>`-block:

```xml
<platform name="android">
  <edit-config file="app/src/main/AndroidManifest.xml" mode="merge" target="/manifest/application">
    <application android:usesCleartextTraffic="true" />
  </edit-config>
  <!-- ... -->
</platform>
```


### Specific requirements
Every interface or app has their own requirements defined in their README file.

### Backend / API
Every interface or app will refer to the specific services or APIs they require.

See the [/services/](../services/)-directory in this repository.


### Dependencies in use
All interfaces use a common set of dependencies/frameworks/libraries.

- [Ionic v4](https://ionicframework.com/docs/v4/)  
  This UI-kit or library gives us a foundation to quickly build interfaces cross-platform and cross-device-type(mobile/desktop).  
  We use the (default) framework of Angular with(in) Ionic.
  - Available components: <https://ionicframework.com/docs/v4/components>
  - CSS Utilities: <https://ionicframework.com/docs/v4/layout/css-utilities>
  - Icons: <https://ionicons.com/v4/>

- [Angular v7](https://v7.angular.io/docs)  
  This front-end framework gives us a structure to create components that can be connected, combined, share data and can be delivered as a web-app.
  - API Documentation: <https://v7.angular.io/api>
  - Used by Angular, RxJS: <https://rxjs-dev.firebaseapp.com/api>

- [`ngx-translate`](http://www.ngx-translate.com/)  
  An Angular-service to handle internationalization(i18n) or translations.
  - API Documentation: <https://github.com/ngx-translate/core#api>

  - [`ngx-translate-lint` v1.4](https://www.npmjs.com/package/ngx-translate-lint/v/1.4.0)  
    A lint-tool to check for missing or unused translations or typos in keys.
  - GitHub: <https://github.com/svoboda-rabstvo/ngx-translate-lint/tree/v1.4.0>

- [`ngx-scanner` v2](https://www.npmjs.com/package/@zxing/ngx-scanner/v/2.0.1)
  An Angular-component to scan QR-codes with a browser.
  - GitHub: <https://github.com/zxing-js/ngx-scanner/tree/v2.0.1>

### Continuous Integration (CI)
Every interface has their own Azure Pipeline set up to run tests and generate 'builds'.  
See their status on the [main README](../README.md#status).

The appropriate tests will run automatically when relevant files are changed in a PR.

To explicitly trigger a *native* build of the code (for Android), make sure to name your PR branch with the prefix `native` or `android`.


## Deployment

### Building for production
To generate a 'production ready' build of an interface, some environment-variables need to be set.
The convention by [`dotenv`](https://www.npmjs.com/package/dotenv) is used.

Possible variables are available in `.env.example` files for each interface. Make a local copy to set them:

    cp .env.example .env

When creating a production build, they are automatically used and inserted into the build.


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

### UNIT TESTS
There are a few reasons why we write unit tests cases:
-  Unit tests are written to ensure the integrity the functional level aspect of the code written. It helps us identify mistakes, unnecessary code and also when there is room for improvement to make the code more intuitive and efficient.
-  We also write unit test cases to clearly state what the method is supposed to do, so it is smoother for new joiners to be onboarded
-  It helps us achieve recommended devOps protocols for maintaining code base while working within teams.

How are Unit Tests affected when we make changes within the code in future?
-  We should aim to write and update unit tests along side the current development, so that our tests are up to date and also reflect the changes done. Helps us stay in track
-  Unit tests in this case differ from manual or automated UI testing. While UI may not exhibit any changes on the surface it is possible code itself might be declaring new variables or making new method calls upon modifications, all of those need to be tested and the new test-scenario or spec-file should be committed together with the feature change.


Keep the following points in mind while writing test cases:
-  We should follow a practice to write to tests for all methods except the ones which are private.
-  Every method which contains an async call, can be tested by returning a promise that can be spied and stubbed to verify the UI behavior.
-  We should aim to write a complementary test for each method written on the file
-  Verify class declarations and modifications through methods, boolean variables, string variables, etc.
- Monitor changes within the HTML template and verify through test cases
-  values within html tags or buttons etc.
- Create "it ("should...." scenarios for conditional code as well (e.g. if/else blocks)
- NOTE: It isn't necessary to test all the variables and all method calls, however a highlight of what the method is supposed to accomplish should be reflected within the test cases.
- Use the "`fit`" and "`fdescribe`" to execute only the unit test cases that you are currently working on. Make sure **not** to commit these commands.
- In order to provide more options, I have added phantomJS into the config files as well so a chrome browser is not needed to be launched every time we need to execute unit test case (type: "ng test ---browser=PhantomJS"

- Testing class variables and objects, when they are being defined or constructed
- There are several methods which serve the purpose of defining class wide variables, which we should also test and verify. One of the typical examples of one such method is `ngOnInit`

```ts
it('ngOnInit: should set up variables', () => {
  expect(component.isLoggedIn).toBeDefined(); // check for class variables to be defined
  expect(component.someValye).toBeTruthy();  // check for a variable to be TRUE
  expect(component.someValye).toBeFalsy();  // check for a variable to be FALSE
});
```

The methods written as `toBeTruthy` are called matchers, they help us compare the expected values, their types, whether a method was called, the arguments of the methods and also their existence. There are various methods provided by the testing module. We can find a detailed list of those methods and their usage here: https://jasmine.github.io/api/3.5/matchers.html

A short introduction tutorial, to start off writing test cases can be found at: https://jasmine.github.io/tutorials/your_first_suite


#### Testing method callbacks and changes
-  In order to test for methods to have been called, or been called with certain arguments use `spy` and `toHaveBeenCalled`/ `toHaveBeenCalledWith` matchers.

```ts

//Code
function  doLogin (params:type) {
    event.preventDefault()
}

//Test
it('some_method: should call another fn', () => {
  spyOn(event, "preventDefault"); // Monitor the said method
  component.doLogin(event); // call some_method
  expect(event.preventDefault).toHaveBeenCalled(); // check for the monitored method to have been called
});
```

#### Testing conditional statements
-  Make separate `it` blocks for different conditions.
```ts
it("Test when xyz === 'some-value'", () => {})
it("Test when xyz !== 'some-value'", () => {})
```

#### Testing Async Mehthods (i.e. methods which make an API call)
-  Make a Spy for the specific async call which returns a Promise object. For example a method containing a call routine `this.programsService.changePassword` can be spied using following

        let spy = spyOn(component.programsService, "changePassword").and.returnValue(Promise.resolve(true));


-  Based on the changes / executions upon the completion of the async request, we should aim to test the changes and modifications.

        spy.calls.mostRecent().returnValue.then(() => { // block to test what happenes after the async calls.
            // Here goes expectations and changes
        });

-  Make sure the `done()` method is used to account for the async calls and fake async stubs/spies.

        it('XYZ', (done) => {
          // spies and stubs

          spy.calls.mostRecent().returnValue.then(() => {
              // tests
              done(); // to complete the tests
          });
        });

#### Testing HTML Tags
-  By using the `defaultEl` and the monitoring the changes within the HTML pages. However, the testing here does not bring a lot of productivity in terms of what we get out of it. So, we can choose to discard this aspect of testing.
-  HTML tags are tested by matching the `string` values, which is not very intuitive with `i18n` modules in use
