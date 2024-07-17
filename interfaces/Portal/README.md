# Portal

The front-end for the _Humanitarian Organization_ web portal, where users can interact with the 121 Platform.

## Configuration

Set all ENV-variables in a local `.env`-file, based on: [`.env.example`](.env.example)-file. Each allowed/required value is explained in the example file.

## Dependencies in use

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

- [`@swimlane/ngx-datatable` v20](https://www.npmjs.com/package/@swimlane/ngx-datatable/v/20.1.0)  
  A component to render rows and columns of generic data and add basic functionalities like sorting, selecting, filtering, etc.

  \- Documentation (latest only!): <https://swimlane.gitbook.io/ngx-datatable/>
  \- GitHub Docs: <https://github.com/swimlane/ngx-datatable/tree/20.1.0/docs>

---

## License

Released under the Apache 2.0 License. See [LICENSE](LICENSE).
